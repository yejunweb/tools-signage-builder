import _ from 'lodash'
import * as THREE from 'three'
import { signShowTypeEnum, signShowTypeMap } from './index'
import { drawAdaptiveText, getMinFontSizeOfLine } from './drawAdaptiveText'
import { getCompressCanvasTextureSize } from '@/components/editor-map/ModelLighting/utils/compressCanvasTexture.js'

const BASIC_COLOR = '#ffffff' // 基础颜色
const BASIC_BACKGROUD_OF_BUNGALOW = '#ef7296' // 背景颜色（洋房）
const BASIC_BACKGROUD_OF_HIGHRISE = '#5dabd7' // 背景颜色（小高层）
const SPLIT_LINE_WIDTH = 2 // 分割线宽度
const SPLIT_LINE_DASH = [10, 5] // 分割线虚线样式
const BORDER_LINE_WIDTH = 2 // 边框线宽度
const ROUND_RADII_WIDTH = 15 // 圆角半径

export const generateSignTexture = ({
    lengthOfLong,
    lengthOfShort,
    buildingNum,
    totalFloorNum,
    showTypeLs,
    showInfoLs,
}) => {
    const _showTypeLs = [...showTypeLs] // 缓存原始数据
    showTypeLs = _.uniq(showTypeLs.map(v => signShowTypeMap?.[v] || v)) // 映射层级关系、并去重
    const showTypeKeys = _.uniq(Object.keys(signShowTypeEnum).map(v => signShowTypeMap?.[v] || v)) // 获取映射后的显示类型、并去重

    let canvas = document.createElement('canvas')
    canvas.width = lengthOfLong
    canvas.height = lengthOfShort
    let ctx = canvas.getContext('2d')

    // 外层圆角矩形
    ctx.beginPath()
    ctx.strokeStyle = BASIC_COLOR
    ctx.lineWidth = BORDER_LINE_WIDTH
    ctx.roundRect(
        BORDER_LINE_WIDTH * 0.5,
        BORDER_LINE_WIDTH * 0.5,
        canvas.width - BORDER_LINE_WIDTH,
        canvas.height - BORDER_LINE_WIDTH,
        ROUND_RADII_WIDTH
    )
    ctx.stroke()

    // 内层圆角矩形
    ctx.beginPath()
    ctx.fillStyle = totalFloorNum >= 12 ? BASIC_BACKGROUD_OF_HIGHRISE : BASIC_BACKGROUD_OF_BUNGALOW
    ctx.roundRect(
        BORDER_LINE_WIDTH,
        BORDER_LINE_WIDTH,
        canvas.width - BORDER_LINE_WIDTH * 2,
        canvas.height - BORDER_LINE_WIDTH * 2,
        ROUND_RADII_WIDTH - BORDER_LINE_WIDTH * 0.75
    )
    ctx.fill()

    // 基准高度值
    const avgHeight = canvas.height / showTypeLs.length

    // 添加横向虚线
    showTypeLs.forEach((v, i) => {
        if (i !== showTypeLs.length - 1) {
            ctx.beginPath()
            ctx.moveTo(0, avgHeight + i * avgHeight) // 坐标轴为左上角
            ctx.lineTo(canvas.width, avgHeight + i * avgHeight)
            ctx.strokeStyle = BASIC_COLOR
            ctx.lineWidth = SPLIT_LINE_WIDTH
            ctx.setLineDash(SPLIT_LINE_DASH)
            ctx.stroke()
            ctx.setLineDash([])
        }
    })

    // 添加栋号、楼层信息
    if (showTypeLs.includes('basicInfo')) {
        const basicTextLs = _showTypeLs.includes('basicInfo') // 数据兼容处理：已存在 basicInfo 参数时，不使用过滤逻辑
            ? [buildingNum + '#', totalFloorNum + 'F']
            : [
                  _showTypeLs.includes('buildInfo') ? buildingNum + '#' : '',
                  _showTypeLs.includes('floorInfo') ? totalFloorNum + 'F' : '',
              ].filter(Boolean) // 过滤实际选中的数据
        const basicAvgWidth = canvas.width / basicTextLs.length
        const basicFontSize = getMinFontSizeOfLine(basicTextLs, basicAvgWidth, avgHeight)
        basicTextLs.forEach((v, i) => {
            if (i !== basicTextLs.length - 1) {
                ctx.beginPath()
                ctx.moveTo(basicAvgWidth * (i + 1), 0)
                ctx.lineTo(basicAvgWidth * (i + 1), avgHeight)
                ctx.strokeStyle = BASIC_COLOR
                ctx.lineWidth = SPLIT_LINE_WIDTH
                ctx.setLineDash(SPLIT_LINE_DASH)
                ctx.stroke()
                ctx.setLineDash([])
            }
            drawAdaptiveText(
                ctx,
                v,
                basicAvgWidth,
                avgHeight,
                (basicAvgWidth / 2) * (2 * i + 1),
                avgHeight / 2,
                {
                    fontSize: basicFontSize,
                    useAutoFontSize: false, // 不自动调整字体大小
                }
            )
        })
    }

    // 添加单元号信息
    if (showTypeLs.includes('unitInfo') && showInfoLs?.length) {
        const unitTextLs = showInfoLs.map(v => v.unitNum + '单元')
        const unitAvgWidth = canvas.width / unitTextLs.length
        const unitFontSize = getMinFontSizeOfLine(unitTextLs, unitAvgWidth, avgHeight)
        const unitAccCount = _.intersection(
            showTypeLs.filter(v => ['basicInfo'].includes(v)),
            showTypeKeys
        ).length

        // 处理户型划分对应单元信息、基于索引计算需要合并的单元
        let curUnitNumKey
        let curUnitNumIndex
        const unitMergeMap = showInfoLs.reduce((prev, cur, index) => {
            if (curUnitNumKey !== cur.unitNum) {
                curUnitNumKey = cur.unitNum
                curUnitNumIndex = index
            }
            curUnitNumKey = cur.unitNum
            if (!prev[curUnitNumIndex]) prev[curUnitNumIndex] = 0
            prev[curUnitNumIndex] += 1
            return prev
        }, {})

        unitTextLs.forEach((v, i) => {
            if (!unitMergeMap[i]) return
            if (i !== unitTextLs.length - 1) {
                ctx.beginPath()
                ctx.moveTo(unitAvgWidth * (i + unitMergeMap[i]), avgHeight * unitAccCount)
                ctx.lineTo(unitAvgWidth * (i + unitMergeMap[i]), avgHeight * (unitAccCount + 1))
                ctx.strokeStyle = BASIC_COLOR
                ctx.lineWidth = SPLIT_LINE_WIDTH
                ctx.setLineDash(SPLIT_LINE_DASH)
                ctx.stroke()
                ctx.setLineDash([])
            }
            drawAdaptiveText(
                ctx,
                v,
                unitAvgWidth,
                avgHeight,
                (unitAvgWidth / 2) * (2 * i + unitMergeMap[i]),
                avgHeight / 2 + avgHeight * unitAccCount,
                {
                    fontSize: unitFontSize,
                    useAutoFontSize: false,
                }
            )
        })
    }

    // 添加房号信息
    if (showTypeLs.includes('roomInfo') && showInfoLs?.length) {
        const roomTextLs = showInfoLs.map(v => v.roomId)
        const roomAvgWidth = canvas.width / roomTextLs.length
        const roomFontSize = getMinFontSizeOfLine(roomTextLs, roomAvgWidth, avgHeight)
        const roomAccCount = _.intersection(
            showTypeLs.filter(v => ['basicInfo', 'unitInfo'].includes(v)),
            showTypeKeys
        ).length

        roomTextLs.forEach((v, i) => {
            if (i !== roomTextLs.length - 1) {
                ctx.beginPath()
                ctx.moveTo(roomAvgWidth * (i + 1), avgHeight * roomAccCount)
                ctx.lineTo(roomAvgWidth * (i + 1), avgHeight * (roomAccCount + 1))
                ctx.strokeStyle = BASIC_COLOR
                ctx.lineWidth = SPLIT_LINE_WIDTH
                ctx.setLineDash(SPLIT_LINE_DASH)
                ctx.stroke()
                ctx.setLineDash([])
            }
            drawAdaptiveText(
                ctx,
                v,
                roomAvgWidth,
                avgHeight,
                (roomAvgWidth / 2) * (2 * i + 1),
                avgHeight / 2 + avgHeight * roomAccCount,
                {
                    fontSize: roomFontSize,
                    useAutoFontSize: false,
                }
            )
        })
    }

    // 添加面积信息
    if (showTypeLs.includes('areaInfo') && showInfoLs?.length) {
        const areaTextLs = showInfoLs.map(v => v.area + 'm²')
        const areaAvgWidth = canvas.width / areaTextLs.length
        const areaFontSize = getMinFontSizeOfLine(areaTextLs, areaAvgWidth, avgHeight)
        const areaAccCount = _.intersection(
            showTypeLs.filter(v => ['basicInfo', 'unitInfo', 'roomInfo'].includes(v)),
            showTypeKeys
        ).length
        areaTextLs.forEach((v, i) => {
            if (i !== areaTextLs.length - 1) {
                ctx.beginPath()
                ctx.moveTo(areaAvgWidth * (i + 1), avgHeight * areaAccCount)
                ctx.lineTo(areaAvgWidth * (i + 1), avgHeight * (areaAccCount + 1))
                ctx.strokeStyle = BASIC_COLOR
                ctx.lineWidth = SPLIT_LINE_WIDTH
                ctx.setLineDash(SPLIT_LINE_DASH)
                ctx.stroke()
                ctx.setLineDash([])
            }
            drawAdaptiveText(
                ctx,
                v,
                areaAvgWidth,
                avgHeight,
                (areaAvgWidth / 2) * (2 * i + 1),
                avgHeight / 2 + avgHeight * areaAccCount,
                {
                    fontSize: areaFontSize,
                    ...(showInfoLs[i]?.areaFontColor && {
                        fontColor: showInfoLs[i]?.areaFontColor,
                    }),
                    ...(showInfoLs[i]?.areaStrokeColor && {
                        strokeColor: showInfoLs[i]?.areaStrokeColor,
                    }),
                    ...(showInfoLs[i]?.areaStrokeWidth && {
                        strokeWidth: showInfoLs[i]?.areaStrokeWidth,
                    }),
                    useAutoFontSize: false,
                }
            )
        })
    }

    // Canvas 材质压缩处理
    const { blockWidth, blockHeight } = getCompressCanvasTextureSize({
        originWidth: lengthOfLong,
        originHeight: lengthOfShort,
        repeatX: 1,
        repeatY: 1,
        compressRatio: 0.8, // 压缩比例
    })
    let _canvas = document.createElement('canvas')
    _canvas.width = blockWidth
    _canvas.height = blockHeight
    let _ctx = _canvas.getContext('2d')
    _ctx.drawImage(canvas, 0, 0, blockWidth, blockHeight)

    const signTexture = new THREE.CanvasTexture(_canvas)
    canvas = null
    _canvas = null
    ctx = null
    _ctx = null

    return signTexture
}
