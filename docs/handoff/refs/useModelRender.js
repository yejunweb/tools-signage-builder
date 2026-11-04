import { useEventBus } from '@vueuse/core'
import { ref, shallowRef, onMounted, onBeforeUnmount } from 'vue'
import * as THREE from 'three'
import * as TWEEN from 'tween.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer'
import { tweenCamera } from '@/components/ModelAnalysis/utils/tweenCamera'
import { modelReslove, getEnableClickModleLs } from '../utils/modelReslove.js'
import { clearMeshCache } from '@/components/ModelAnalysis/utils/index'
import { generateSignTexture } from '../utils/generateSignTexture'
const $busOfSetSignProperties = useEventBus('setSignProperties')

export const useModelRender = ({ className }) => {
    let container // 视图容器
    let modelUrl // 模型加载路径
    let modelScale = 1 // 模型缩放倍数

    let scene = shallowRef() // 场景
    let renderer // 渲染器
    let labelRenderer // 标签渲染器
    let camera = shallowRef() // 相机

    let controls = shallowRef() // 摄像头控制
    let originTarget = ref() // 记录原始的旋转中心点

    let manager // 加载进度监听
    let progress = ref(0) // 模型加载进度
    let loading = ref(false) // 模型加载loading

    let globalModel // 记录模型
    let rotateMsg = ref({}) // 偏移角度

    let requestId // requestAnimationFrame 标识 ID
    let isShowSingle = ref(false) // 默认展示所有楼栋

    let modelDataSet = shallowRef({}) // 模型信息
    let currentBuilding = ref('') // 当前选中楼栋
    let isCustomSignModel = ref(false) // 是否为自定义标牌类型模型

    let originCameraPosition = ref() // 记录原始摄像机位置
    let hideMeshWhiteList = ['customFloor', 'customRoad'] // 不被隐藏的 Mesh 白名单（Todo：需要排除地面和标牌）

    let modelLoadedCallback // 模型加载完成后回调

    /**
     * methods
     */
    const init = args => {
        modelUrl = args.modelUrl
        modelLoadedCallback = args.modelLoadedCallback

        initScene()
        initCamera()
        initRenderer()
        initControls()
        setManager()
        loadModel()
        animate()
        initClick()
    }

    // 初始化场景
    const initScene = () => {
        scene.value = new THREE.Scene()
        scene.value.background = new THREE.CubeTextureLoader()
            .setPath('/modelAnalysis/')
            .load(['center.png', 'center.png', 'top.png', 'down.png', 'center.png', 'center.png'])
        scene.value.add(new THREE.AmbientLight(0xffffff, 1.2)) // 添加环境光
        scene.value.add(new THREE.HemisphereLight(0xffffff, 0xffffff, 1.8)) // 添加半球光
        scene.value.receiveShadow = true

        // 添加坐标轴辅助
        // const axesHelper = new THREE.AxesHelper(100)
        // scene.value.add(axesHelper)

        // 添加地面
        const floorGeometry = new THREE.CircleGeometry(1024, 1024)
        const floorMaterial = new THREE.MeshLambertMaterial({
            color: 0x63718b,
            side: THREE.DoubleSide,
        })
        const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial)
        floorMesh.rotation.x = -0.5 * Math.PI
        floorMesh.position.y = -0.5
        floorMesh.castShadow = true
        floorMesh.receiveShadow = true
        floorMesh.name = 'customFloor'
        scene.value.add(floorMesh)
    }

    // 初始化相机
    const initCamera = () => {
        camera.value = new THREE.PerspectiveCamera(
            45,
            container.clientWidth / container.clientHeight,
            1,
            3000
        )
        camera.value.position.set(0, 200, 200) // 设置相机所在的位置
        camera.value.lookAt(scene.value.position)
    }

    // 初始化渲染器
    const initRenderer = () => {
        renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true, // 抗锯齿
            logarithmicDepthBuffer: true, // 使用对数深度缓存
        })
        renderer.setSize(container.clientWidth, container.clientHeight)
        renderer.setPixelRatio(window.devicePixelRatio)
        renderer.shadowMap.enabled = true // 告诉渲染器需要阴影效果
        container.appendChild(renderer.domElement) // 加入视图容器

        labelRenderer = new CSS2DRenderer()
        labelRenderer.setSize(container.clientWidth, container.clientHeight)
        labelRenderer.domElement.style.position = 'absolute'
        labelRenderer.domElement.style.top = '0'
        container.appendChild(labelRenderer.domElement)
    }

    // 初始化控制器
    const initControls = () => {
        controls.value = new OrbitControls(camera.value, labelRenderer.domElement)
        controls.value.enableDamping = true // 使动画循环使用时阻尼或自转 意思是否有惯性
        controls.value.enableZoom = true // 是否可以缩放
        // controls.value.enablePan = false // 禁用摄像机平移
        controls.value.minDistance = 100 // 设置相机距离原点的最远距离
        controls.value.maxDistance = 800 // 设置相机距离原点的最远距离
        controls.value.minPolarAngle = 0 // 设置相机垂直旋转的角度的下限
        controls.value.maxPolarAngle = Math.PI / 2 - 0.1 // 设置相机垂直旋转的角度的上限
        originTarget.value = controls.value.target.clone()

        // 监听当前相机偏移角度
        controls.value.addEventListener('change', () => {
            const rotation = camera.value.rotation
            rotateMsg.value = {
                x: THREE.MathUtils.radToDeg(rotation.x),
                y: THREE.MathUtils.radToDeg(rotation.y),
                z: THREE.MathUtils.radToDeg(rotation.z),
            }
        })
    }

    // 加载进度监听
    const setManager = () => {
        manager = new THREE.LoadingManager()
        manager.onStart = () => {
            loading.value = true
        }
        manager.onLoad = () => {
            loading.value = false
        }
        manager.onProgress = (url, itemsLoaded, itemsTotal) => {
            progress.value = (itemsLoaded / itemsTotal).toFixed(2) * 100
        }
        manager.onError = () => {
            loading.value = false
            console.error('Model load failed')
        }
    }

    // 模型加载
    const loadModel = () => {
        const loader = new GLTFLoader(manager)
        loader.load(
            modelUrl,
            gltf => {
                const model = gltf.scene

                // 遍历模型中的所有子对象，设置阴影接收和投射属性
                model.traverse(child => {
                    if (child.isMesh) {
                        child.material.side = THREE.DoubleSide
                        child.castShadow = true // 设置产生投影的网格模型（Todo：需要排除标牌）
                        child.receiveShadow = true // 设置接收阴影的投影面
                        if (/^DT-\d+$/.test(child.name)) hideMeshWhiteList.push(child.name) // 匹配底图名称
                    }
                })
                model.scale.set(modelScale, modelScale, modelScale)
                model.name = 'community'

                // 设置模型居中展示
                const modelBox = new THREE.Box3().setFromObject(model)
                const boxCenter = modelBox.getCenter(new THREE.Vector3())
                model.position.x += model.position.x - boxCenter.x
                model.position.z += model.position.z - boxCenter.z
                model.position.y = 0

                // 添加包围盒辅助
                // const boxHelper = new THREE.BoxHelper(model, 0xff0000)
                // scene.value.add(boxHelper)

                globalModel = model
                scene.value.add(model)

                // 设置模型信息
                modelDataSet.value = modelReslove(globalModel)
                console.log('modelDataSet.value: ', modelDataSet.value)

                // 设置是否为自定义标牌类型模型
                const signList = modelDataSet.value.buildingLs.flatMap(v => v.signLs, 2)
                isCustomSignModel.value =
                    signList.length === signList.filter(v => v.isCustomSign).length

                // 设置标签展现
                setBuildingLabel()

                // 设置默认展示楼栋
                // setCurrentBuilding()

                createRoad()

                if (modelLoadedCallback) modelLoadedCallback()
            },
            undefined,
            error => {
                console.error(error)
            }
        )
    }

    // 设置标牌材质
    const setSignTexture = (signLs, onlyTexture = true) => {
        signLs.forEach(v => {
            const { signOriginName, signVertices, signWidth, signHeight, showTypeLs, showInfoLs } =
                v
            const signMesh = scene.value.getObjectByName(signOriginName)
            if (!signMesh) return

            if (!onlyTexture) {
                // 设置顶点坐标
                signMesh.geometry.setAttribute(
                    'position',
                    new THREE.Float32BufferAttribute(
                        signVertices.flatMap(v => [v.x, v.y, v.z], 2),
                        3
                    )
                )
                // 设置顶点索引
                signMesh.geometry.setIndex([0, 1, 2, 0, 2, 3])
                // 设置 UV 坐标
                signMesh.geometry.setAttribute(
                    'uv',
                    new THREE.Float32BufferAttribute(
                        [
                            0,
                            1, // 左上
                            1,
                            1, // 右上
                            1,
                            0, // 右下
                            0,
                            0, // 左下
                        ],
                        2
                    )
                )
            }
            // 生成 Canvas 材质
            const signTexture = generateSignTexture({
                lengthOfLong: signWidth * 7.897,
                lengthOfShort: signHeight * 7.897,
                buildingNum: v.buildingNum,
                totalFloorNum: v.totalFloorNum,
                showTypeLs,
                showInfoLs,
            })
            const signMaterial = new THREE.MeshStandardMaterial({
                map: signTexture,
                side: THREE.DoubleSide,
                alphaTest: 0.5,
                transparent: true,
                emissive: 0x6b7280, // 自发光颜色
                emissiveIntensity: 0.005, // 自发光强度
            })
            signMesh.material = signMaterial
        })
    }

    // 创建标签
    const setBuildingLabel = (progressMap, dataSet) => {
        let labelGroup = scene.value.getObjectByName('isLabelGroup')
        if (labelGroup) {
            const divLabelLs = document.querySelectorAll('.building-status-label')
            for (let i = 0; i < divLabelLs.length; i++) {
                const divLabel = divLabelLs[i]
                // 更新标签状态
                divLabel.setAttribute(
                    'class',
                    ['building-status-label', progressMap?.[divLabel.id]].join(' ')
                )
                // 更新标签内容
                if (dataSet?.[divLabel.id]?.['basicInformationDb']?.['buildingNum']) {
                    divLabel.textContent = `楼栋-${
                        dataSet[divLabel.id]['basicInformationDb']['buildingNum']
                    }#`
                }
            }
        } else {
            labelGroup = new THREE.Group()
            ;(modelDataSet.value.buildingLs || []).forEach(v => {
                const div = document.createElement('div')
                div.id = v.buildingOriginName
                div.className = ['building-status-label', progressMap?.[v.buildingOriginName]].join(
                    ' '
                )
                div.textContent = `楼栋-${v.buildingNum}#`
                const divLabel = new CSS2DObject(div)
                divLabel.position.copy(
                    new THREE.Vector3(
                        v.buildingPos.x,
                        v.buildingPos.y + v.floorHeight * 2.5, // 置于建筑物顶部 2.5 倍层高处
                        v.buildingPos.z
                    )
                )
                labelGroup.add(divLabel)
            })
            labelGroup.name = 'isLabelGroup'
            scene.value.add(labelGroup)
        }
    }

    // 生成路面（四周）
    const createRoad = () => {
        const group = new THREE.Group()
        const box = new THREE.Box3().setFromObject(globalModel)
        const width = 20
        const distance = 20 // 路面和建筑之间的距离
        const length =
            (box.min.distanceTo(new THREE.Vector3(box.max.x, 0, box.max.z)) +
                (width / 2 + distance) * 2) *
            1.5 // ( 底面对角线长度 + 路面偏移距离 * 2 ) * 1.5

        // 前
        const cubeFont = new THREE.Mesh(
            new THREE.BoxGeometry(width, length, 0.1),
            new THREE.MeshLambertMaterial({
                color: 0xb8b8b8,
                // wireframe: true,
            })
        )
        cubeFont.position.z = box.max.z + (width / 2 + distance)
        cubeFont.position.y = 0.5
        cubeFont.rotation.x = -0.5 * Math.PI
        cubeFont.rotation.z = -0.5 * Math.PI
        cubeFont.receiveShadow = true
        cubeFont.name = 'customRoad'
        group.add(cubeFont)

        // 后
        const cubeBack = cubeFont.clone()
        cubeBack.position.z = box.min.z - (width / 2 + distance)
        group.add(cubeBack)

        // 左
        const cubeLeft = cubeBack.clone()
        cubeLeft.position.z = 0
        cubeLeft.position.x = box.min.x - (width / 2 + distance)
        cubeLeft.rotation.z = 0
        group.add(cubeLeft)

        // 右
        const cubeRight = cubeLeft.clone()
        cubeRight.position.x = box.max.x + (width / 2 + distance)
        group.add(cubeRight)

        group.name = 'isRoadGroup'
        scene.value.add(group)
    }

    const render = () => {
        renderer.render(scene.value, camera.value)
        labelRenderer.render(scene.value, camera.value)
        controls.value.update()
        TWEEN.update()
    }

    const animate = () => {
        render()
        requestId = requestAnimationFrame(animate)
    }

    // 获取建筑物中心坐标
    // const getBuildMidPosition = targetGroup => {
    //     const targetBox = new THREE.Box3().setFromObject(targetGroup)
    //     const { min, max } = targetBox
    //     // const boxHelper = new THREE.BoxHelper(targetGroup, 0xff0000)
    //     // scene.value.add(boxHelper)
    //     const midPosition = new THREE.Vector3().lerpVectors(min, max, 0.5) // 中心坐标
    //     const toPosition = new THREE.Vector3(midPosition.x, 200, midPosition.z + 300) // 摄像机偏移坐标

    //     return {
    //         minPosition: min,
    //         maxPosition: max,
    //         midPosition,
    //         toPosition,
    //     }
    // }

    // 设置当前操作楼栋
    const setCurrentBuilding = targetName => {
        const targetObject = scene.value.getObjectByName(targetName) // 当前选中对象
        const targetGroup = targetObject?.parent // 当前选中建筑物

        isShowSingle.value = true
        currentBuilding.value = targetGroup.name

        hideExcludedMesh(targetObject, targetGroup) // 隐藏其他楼栋
        originCameraPosition.value = camera.value.position.clone()

        controls.value.enabled = false
        tweenCamera(
            camera.value,
            camera.value.position,
            targetGroup,
            controls.value.target,
            scene.value.position,
            400,
            controls.value,
            () => {
                controls.value.enabled = true
                controls.value.update()
            },
            { mode: 'objectFit', container }
        )
    }

    // 设置当前高亮的户室
    const setRoomActive = targetName => {
        let roomMarkMesh = scene.value.getObjectByName('isRoomMark')
        if (roomMarkMesh) roomMarkMesh.parent.remove(roomMarkMesh)
        if (!targetName) return
        const targetMesh = scene.value.getObjectByName(targetName) // 当前选中对象
        if (!targetMesh) return
        roomMarkMesh = targetMesh.clone()
        roomMarkMesh.material = new THREE.MeshBasicMaterial({
            color: 0xef4444,
            side: THREE.DoubleSide,
            opacity: 0.5,
            transparent: true,
            depthTest: true,
            polygonOffset: true,
            polygonOffsetFactor: -1,
            polygonOffsetUnits: -1,
        })

        roomMarkMesh.renderOrder = 1
        roomMarkMesh.name = 'isRoomMark'
        targetMesh?.parent?.add(roomMarkMesh)

        controls.value.enabled = false
        tweenCamera(
            camera.value,
            camera.value.position,
            targetMesh,
            controls.value.target,
            scene.value.position,
            400,
            controls.value,
            () => {
                controls.value.enabled = true
                controls.value.update()
            },
            { mode: 'objectFit', container }
        )
    }

    // 设置当前高亮的采光面
    const setFaceActive = targetNames => {
        let faceMarkMesh = scene.value.getObjectByName('isFaceMark')
        if (faceMarkMesh) faceMarkMesh.parent.remove(faceMarkMesh)
        if (!targetNames) return

        const [targetBottomName, targetTopName] = targetNames
        const targetTopMesh = scene.value.getObjectByName(targetTopName) // 采光面顶部
        const targetBottomMesh = scene.value.getObjectByName(targetBottomName) // 采光面底部
        if (!targetTopMesh || !targetBottomMesh) return

        // 获取顶部、底部采光面 最大、最小坐标
        const targetTopMeshBox = new THREE.Box3().setFromObject(targetTopMesh)
        const { min: targetTopMeshBoxMin, max: targetTopMeshBoxMax } = targetTopMeshBox
        const targetBottomMeshBox = new THREE.Box3().setFromObject(targetBottomMesh)
        const { min: targetBottomMeshBoxMin, max: targetBottomMeshBoxMax } = targetBottomMeshBox

        faceMarkMesh = targetTopMesh.clone()
        faceMarkMesh.scale.z =
            faceMarkMesh.scale.z *
            ((targetTopMeshBoxMax.y - targetBottomMeshBoxMin.y) /
                (targetTopMeshBoxMax.y - targetTopMeshBoxMin.y) +
                1)
        faceMarkMesh.position.y -= (targetTopMeshBoxMax.y - targetBottomMeshBoxMin.y) / 2
        faceMarkMesh.material = new THREE.MeshBasicMaterial({
            color: 0xef4444,
            side: THREE.DoubleSide,
            opacity: 0.5,
            transparent: true,
            depthTest: true,
            polygonOffset: true,
            polygonOffsetFactor: -1,
            polygonOffsetUnits: -1,
        })

        faceMarkMesh.renderOrder = 1
        faceMarkMesh.name = 'isFaceMark'
        targetTopMesh?.parent?.add(faceMarkMesh)

        controls.value.enabled = false
        tweenCamera(
            camera.value,
            camera.value.position,
            faceMarkMesh,
            controls.value.target,
            scene.value.position,
            400,
            controls.value,
            () => {
                controls.value.enabled = true
                controls.value.update()
            },
            { mode: 'objectFit', container }
        )
    }

    // 初始化点击事件
    const initClick = () => {
        let isDragging = false
        const mouse = new THREE.Vector2()
        const raycaster = new THREE.Raycaster()

        container.addEventListener('mousemove', () => {
            isDragging = true
        })
        container.addEventListener('mousedown', () => {
            isDragging = false
        })
        container.addEventListener('mouseup', e => {
            if (isDragging) return
            e.preventDefault()
            mouse.x =
                ((e.clientX - container.getBoundingClientRect().x) / container.clientWidth) * 2 - 1
            mouse.y =
                -((e.clientY - container.getBoundingClientRect().y) / container.clientHeight) * 2 +
                1
            raycaster.setFromCamera(mouse, camera.value)
            const intersects = raycaster.intersectObjects(getEnableClickModleLs(globalModel))

            if (intersects.length > 0 && intersects[0]?.object) {
                if (!isShowSingle.value) {
                    setCurrentBuilding(
                        /^MX-\d+_\d+$/.test(intersects[0]?.object?.name) // 判定是否为子集 MX
                            ? intersects[0]?.object?.parent?.name // 获取父级 MX 名称
                            : intersects[0]?.object?.name
                    )
                } else if (/^BP-\d+$/.test(intersects[0]?.object?.name)) {
                    // 判定是否为楼栋 BP（仅在划分户型步骤生效）
                    $busOfSetSignProperties.emit(intersects[0]?.object?.name)
                }

                isDragging = false
            }
        })
    }

    const backToAll = () => {
        isShowSingle.value = false
        currentBuilding.value = ''

        controls.value.enabled = false
        tweenCamera(
            camera.value,
            camera.value.position,
            originCameraPosition.value,
            controls.value.target,
            scene.value.position,
            600,
            controls.value,
            () => {
                controls.value.enabled = true
                controls.value.update()
            }
        )
        showAllMesh()
    }

    // 显示所有 Mesh
    const showAllMesh = () => {
        const traverse = objects => {
            for (let i = 0; i < objects.length; i++) {
                const v = objects[i]
                if (v?.children?.length) {
                    traverse(v.children)
                } else if (v?.isMesh || v?.isCSS2DObject) {
                    v.visible = true
                }
            }
        }
        traverse(scene.value.children)
    }

    // 隐藏被排除的 Mesh
    const hideExcludedMesh = (targetObject, targetGroup) => {
        const traverse = objects => {
            for (let i = 0; i < objects.length; i++) {
                const v = objects[i]
                if (v?.children?.length && v.name !== targetGroup.name) {
                    traverse(v.children)
                } else if (
                    (v?.isMesh || v?.isCSS2DObject) &&
                    v.name !== targetObject.name &&
                    !hideMeshWhiteList.includes(v.name)
                ) {
                    v.visible = false
                }
            }
        }
        traverse(scene.value.children)
    }

    // 导出楼栋模型
    const exportModel = (useOnlyVisible = true) => {
        return new Promise((resolve, reject) => {
            const exporter = new GLTFExporter()
            const options = {
                binary: true, // 导出为二进制格式
                onlyVisible: useOnlyVisible, // 只导出可见对象
                maxTextureSize: 4096, // 最大纹理尺寸
                includeCustomExtensions: true, // 包含自定义扩展
                embedImages: true, // 将纹理嵌入到文件中
            }

            const modelGroup = scene.value.getObjectByName('community').clone()

            // 优化标牌材质展现
            modelGroup.traverse(child => {
                if (child.isMesh && /^BP-\d+$/.test(child?.name)) {
                    if (child?.material) child.material.needsUpdate = true // 确保材质对光照有反应
                    if (child?.geometry) child.geometry.computeVertexNormals() // 重新计算法线数据
                }
            })

            exporter.parse(
                modelGroup?.children, // 只导出子对象、避免再次嵌套 Group
                gltf => {
                    const blob = new Blob([gltf], { type: 'model/gltf-binary' })
                    resolve(blob)
                    // const link = document.createElement('a')
                    // link.href = URL.createObjectURL(blob)
                    // link.download = 'community.glb'
                    // link.click()
                },
                err => {
                    reject(err)
                },
                options
            )
        })
    }

    // 内存资源释放
    const disposeResource = () => {
        cancelAnimationFrame(requestId)
        clearMeshCache(scene.value)
        scene.value.clear()
        renderer.dispose()
        renderer.forceContextLoss && renderer.forceContextLoss() // 强制丢失上下文
        controls.value.dispose && controls.value.dispose()
        TWEEN.removeAll()

        // 彻底置空引用
        scene.value = null
        camera.value = null
        renderer = null
        controls.value = null
        container = null
    }

    const onResize = () => {
        camera.value.aspect = container.clientWidth / container.clientHeight
        camera.value.updateProjectionMatrix()
        renderer.setSize(container.clientWidth, container.clientHeight)
        labelRenderer.setSize(container.clientWidth, container.clientHeight)
    }

    onMounted(() => {
        container = document.querySelector(className)
    })

    onBeforeUnmount(() => {
        disposeResource()
    })

    return {
        scene,
        camera,
        controls,
        originTarget,
        progress,
        loading,
        rotateMsg,
        isShowSingle,
        modelDataSet,
        currentBuilding,
        isCustomSignModel,
        init,
        loadModel,
        setSignTexture,
        setBuildingLabel,
        setCurrentBuilding,
        setRoomActive,
        setFaceActive,
        backToAll,
        showAllMesh,
        onResize,
        disposeResource,
        exportModel,
    }
}
