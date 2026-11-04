<template>
    <el-dialog
        title="标牌设置"
        :width="dialogWidth"
        custom-class="sign-form-dialog"
        :visible.sync="dialogVisible"
        :close-on-click-modal="false"
        :close-on-press-escape="false"
        modal-append-to-body
        destroy-on-close
        append-to-body
        @closed="handleClosed"
    >
        <el-form
            ref="signFormRef"
            :model="signForm"
            label-width="80px"
            label-position="left"
            size="small"
        >
            <el-form-item
                label="展现类型"
                prop="showTypeLs"
                :rules="{ required: true, message: '展现信息不能为空', trigger: 'blur' }"
            >
                <el-checkbox-group v-model="signForm.showTypeLs">
                    <el-checkbox
                        v-for="v in Object.entries(signShowTypeEnum)"
                        :key="v[0]"
                        :label="v[0]"
                    >
                        {{ v[1] }}
                    </el-checkbox>
                </el-checkbox-group>
            </el-form-item>
            <el-form-item prop="showInfoLs" required>
                <template #label>
                    <div class="custom-label sort-sequence">
                        <span>信息设置</span>
                        <span
                            class="sort-sequence__trigger"
                            @click="
                                () => {
                                    signForm.showInfoLs.reverse()
                                }
                            "
                        >
                            切换顺序
                            <i class="el-icon-sort" />
                        </span>
                    </div>
                </template>
                <div class="show-info">
                    <div
                        v-for="(item, index) in signForm.showInfoLs"
                        :key="index"
                        class="show-info-item"
                    >
                        <el-form-item
                            label="单元"
                            :prop="`showInfoLs[${index}].unitNum`"
                            :show-message="false"
                            required
                        >
                            <el-select
                                v-model="item.unitNum"
                                placeholder="请选择单元"
                                popper-class="custom-select-popper show-info-item__select"
                                clearable
                            >
                                <el-option
                                    v-for="v in unitNumOptions"
                                    :key="v.value"
                                    :label="v.label"
                                    :value="v.value"
                                />
                            </el-select>
                            <span class="show-info-item__suffix">单元</span>
                        </el-form-item>
                        <el-form-item
                            label="房号"
                            :prop="`showInfoLs[${index}].roomId`"
                            :show-message="false"
                            required
                        >
                            <el-select
                                v-model="item.roomId"
                                placeholder="请选择房号"
                                popper-class="custom-select-popper show-info-item__select"
                                clearable
                            >
                                <el-option
                                    v-for="v in roomIdOptions"
                                    :key="v.value"
                                    :label="v.label"
                                    :value="v.value"
                                    :disabled="v.disabled"
                                />
                            </el-select>
                            <span class="show-info-item__suffix">室</span>
                        </el-form-item>
                        <el-form-item
                            label="面积"
                            :prop="`showInfoLs[${index}].area`"
                            :show-message="false"
                            required
                        >
                            <el-input-number
                                v-model="item.area"
                                placeholder="请输入面积"
                                controls-position="right"
                                :min="1"
                                :max="9999"
                                :step="0.1"
                                :precision="2"
                            />
                            <span class="show-info-item__suffix">㎡</span>
                        </el-form-item>
                        <!-- 面积配置 Start（仅勾选展现类型包含 "areaInfo" 时显示） -->
                        <div
                            v-if="signForm.showTypeLs.includes('areaInfo')"
                            class="show-info-item__area-config"
                        >
                            <el-form-item :prop="`showInfoLs[${index}].areaFontColor`">
                                <HexColorPicker
                                    prefixLabel="字体颜色:"
                                    v-model="item.areaFontColor"
                                />
                            </el-form-item>
                            <el-form-item :prop="`showInfoLs[${index}].areaStrokeColor`">
                                <HexColorPicker
                                    prefixLabel="描边颜色:"
                                    v-model="item.areaStrokeColor"
                                />
                            </el-form-item>
                            <el-form-item :prop="`showInfoLs[${index}].areaStrokeWidth`">
                                <el-input-number
                                    v-model="item.areaStrokeWidth"
                                    placeholder="描边宽度"
                                    controls-position="right"
                                    :min="0"
                                    :max="24"
                                    :step="4"
                                    :precision="0"
                                />
                                <span class="show-info-item__suffix">px</span>
                            </el-form-item>
                        </div>
                        <!-- 面积配置 End -->
                        <div class="show-info-item__operate">
                            <span
                                v-if="index === 0"
                                class="add-btn"
                                @click="
                                    () => {
                                        signForm.showInfoLs.unshift({
                                            ...getDefaultShowInfoByLength(),
                                        })
                                    }
                                "
                            >
                                新增
                                <i class="el-icon-plus" />
                            </span>
                            <span
                                v-if="signForm.showInfoLs.length > 1"
                                class="del-btn"
                                @click="
                                    () => {
                                        signForm.showInfoLs.splice(index, 1)
                                    }
                                "
                            >
                                删除
                                <i class="el-icon-close" />
                            </span>
                        </div>
                    </div>
                </div>
            </el-form-item>
        </el-form>
        <div class="sign-form-dialog__operate">
            <el-button class="custom-button" @click="handleCancle"> 取消 </el-button>
            <el-button class="custom-button primary" @click="handleConfirm"> 确定 </el-button>
        </div>
    </el-dialog>
</template>

<script setup>
import _ from 'lodash'
import { ref, reactive, inject, nextTick, computed } from 'vue'
import { isInMapAdmin } from '@/utils/util'
import { signShowTypeEnum } from '../../utils/index.js'
import HexColorPicker from './HexColorPicker.vue'

const props = defineProps({
    visible: {
        type: Boolean,
        default: false,
    },
    signOriginName: {
        type: String,
        default: '',
    },
    currentBuilding: {
        type: String,
        default: '',
    },
})
const emits = defineEmits(['update:visible', 'success'])

// 默认信息
const defaultShowInfo = {
    unitNum: undefined,
    roomId: undefined,
    area: 120,
    areaFontColor: '#ffffff', // 面积字体颜色
    areaStrokeColor: '#ffffff', // 面积字体描边颜色
    areaStrokeWidth: 0, // 面积字体描边宽度
}

/**
 * data
 */
const signFormRef = ref()
const signForm = reactive({
    showTypeLs: [...Object.keys(signShowTypeEnum).slice(0, 2)], // 默认展现栋号、楼层信息
    showInfoLs: [{ ...defaultShowInfo }],
})
const unitNumOptions = ref([])

/**
 * inject
 */
const dataSet = inject('dataSet')

/**
 * methods
 */
const initialize = async () => {
    // 设置表单选项信息
    const { basicInformationDb, signInformation } = dataSet.value?.[props.currentBuilding] || {}
    unitNumOptions.value = new Array(basicInformationDb?.totalUnitNum || 0)
        .fill(0)
        .map((v, i) => ({ label: i + 1, value: i + 1 }))
    // 设置表单返显信息
    await nextTick()
    const curIndex = signInformation.findIndex(v => v.signOriginName === props.signOriginName)
    if (curIndex === -1) return
    let { showTypeLs, showInfoLs } = _.cloneDeep(signInformation[curIndex])
    // 数据兼容处理：已存在 basicInfo 参数，则替换为 buildInfo、floorInfo 参数
    if (showTypeLs.includes('basicInfo')) {
        const index = showTypeLs.findIndex(v => v === 'basicInfo')
        showTypeLs = [
            ...showTypeLs.slice(0, index),
            ...['buildInfo', 'floorInfo'],
            ...showTypeLs.slice(index + 1),
        ]
    }
    Object.assign(signForm, {
        showTypeLs,
        showInfoLs: showInfoLs?.length ? showInfoLs : [{ ...getDefaultShowInfoByLength() }],
    })
}
// 基于当前标牌信息获取表单默认值
const getDefaultShowInfoByLength = length => {
    const _length = length || signForm.showInfoLs.length
    return isInMapAdmin()
        ? {
              ...defaultShowInfo,
              unitNum: unitNumOptions.value?.[Math.floor(_length / 2)]?.value, // 每新增两条信息、单元递增一次
              roomId: roomIdOptions.value?.filter(v => !v.disabled)?.[0]?.value, // 取第一个可用的房号
              area: signForm.showInfoLs[_length - 1]?.area || 120, // 以第一条数据面积信息作为后续默认值
              areaFontColor: signForm.showInfoLs[_length - 1]?.areaFontColor || '#ffffff', // 以第一条数据面积字体颜色作为后续默认值
              areaStrokeColor: signForm.showInfoLs[_length - 1]?.areaStrokeColor || '#ffffff', // 以第一条数据面积字体描边颜色作为后续默认值
              areaStrokeWidth: signForm.showInfoLs[_length - 1]?.areaStrokeWidth || 0, // 以第一条数据面积字体描边宽度作为后续默认值
          }
        : defaultShowInfo
}
const handleConfirm = () => {
    signFormRef.value.validate(valid => {
        if (!valid) return
        dialogVisible.value = false

        const { houseTypesTableMsg, signInformation } = dataSet.value?.[props.currentBuilding] || {}
        const curIndex = signInformation.findIndex(v => v.signOriginName === props.signOriginName)
        if (curIndex === -1) return
        signInformation.splice(curIndex, 1, {
            ...signInformation[curIndex],
            ...signForm,
        })
        // 基于 roomId 进行映射
        const roomIdMap = signForm.showInfoLs.reduce((prev, cur) => {
            prev[cur.roomId] = cur
            return prev
        }, {})
        // 更新 dataSet 中的信息
        dataSet.value = {
            ...dataSet.value,
            [props.currentBuilding]: {
                ...dataSet.value[props.currentBuilding],
                signInformation: _.cloneDeep(signInformation), // 更新标牌信息
                houseTypesTableMsg: {
                    // 更新户型信息
                    column: houseTypesTableMsg.column.map(v => ({
                        ...v,
                        ...(roomIdMap?.[v.roomId] && {
                            unitNum: roomIdMap[v.roomId]?.unitNum,
                            unitName: roomIdMap[v.roomId]?.unitNum + '单元',
                        }),
                    })),
                    data: houseTypesTableMsg.data.map(v => {
                        return Object.entries(v).reduce((prev, cur) => {
                            if (roomIdMap?.[cur[0]]) {
                                prev[cur[0]] = {
                                    ...cur[1],
                                    area: roomIdMap[cur[0]]?.area,
                                }
                            } else {
                                prev[cur[0]] = cur[1]
                            }
                            return prev
                        }, {})
                    }),
                },
            },
        }
        // 外部事件监听
        emits('success')
    })
}
const handleCancle = () => {
    dialogVisible.value = false
}
const handleClosed = () => {
    signFormRef.value.clearValidate()
    Object.assign(signForm, {
        showTypeLs: [],
        showInfoLs: [{ ...defaultShowInfo }],
    })
    unitNumOptions.value = []
}

/**
 * computed
 */
const dialogVisible = computed({
    get() {
        props.visible && initialize()
        return props.visible
    },
    set(val) {
        emits('update:visible', val)
    },
})
const dialogWidth = computed(() => {
    return `calc(485px + ${
        (signForm.showInfoLs.length - 2 > 0
            ? signForm.showInfoLs.length - 2 > 2
                ? 2
                : signForm.showInfoLs.length - 2
            : 0) * 193
    }px)`
})
const roomIdOptions = computed(() => {
    const { houseTypesTableMsg, signInformation } = dataSet.value?.[props.currentBuilding] || {}
    const disabledRoomKeys = [
        ...signInformation
            .filter(v => v.signOriginName !== props.signOriginName)
            .flatMap(v => v?.showInfoLs?.map(v => v.roomId))
            .filter(Boolean), // 排除当前楼栋 其他标牌已选择房号
        ...signForm.showInfoLs.map(v => v.roomId).filter(Boolean), // 排除当前表单 已选择房号
    ]
    return new Array(houseTypesTableMsg?.column?.length || 1).fill(0).map((v, i) => {
        const key = `${i + 1}`.padStart(2, 0)
        return { label: key, value: key, disabled: disabledRoomKeys?.includes(key) }
    })
})
</script>

<style lang="scss">
.sign-form-dialog {
    border-radius: 8px;
    margin-top: 50vh !important;
    transform: translateY(-50%);

    .el-dialog__header {
        padding: 20px 20px 0;

        .el-dialog__title {
            font-size: 16px;
            line-height: 1;
        }

        .el-dialog__close {
            font-size: 16px;
        }
    }

    .el-dialog__body {
        padding: 20px 20px;

        > .el-form {
            flex-shrink: 0;

            > .el-form-item {
                display: flex;
                align-items: flex-start;
                margin-bottom: 18px;

                > .el-form-item__label {
                    display: flex;
                    align-items: flex-start;
                    justify-content: flex-end;
                    flex-direction: row-reverse;
                    font-size: 14px;
                    line-height: 1;
                    padding-right: 0;

                    &::before {
                        margin-left: 4px;
                    }
                }

                .el-form-item__content {
                    margin-left: 0 !important;

                    .el-checkbox-group {
                        width: 365px;
                        display: flex;
                        flex-wrap: wrap;
                        margin-bottom: -8px;

                        .el-checkbox {
                            width: calc((100% - 24px) / 3);
                            line-height: 1;
                            margin-right: 12px;
                            margin-bottom: 12px;

                            &:nth-child(3n) {
                                margin-right: 0;
                            }

                            &__label {
                                line-height: 1;
                                font-weight: normal;
                            }

                            .el-checkbox__inner:hover,
                            .el-checkbox__input.is-focus .el-checkbox__inner {
                                border-color: #53beb7;
                            }
                            .el-checkbox__input.is-checked + .el-checkbox__label {
                                color: #53beb7;
                            }
                            .el-checkbox__input.is-checked .el-checkbox__inner,
                            .el-checkbox__input.is-indeterminate .el-checkbox__inner {
                                background-color: #53beb7;
                                border-color: #53beb7;
                            }
                        }
                    }
                }
            }
        }
    }

    .custom-label {
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: flex-start;
        position: relative;
    }

    .sort-sequence .sort-sequence__trigger {
        color: #6b7280;
        font-size: 12px;
        display: flex;
        align-items: center;
        white-space: nowrap;
        position: absolute;
        bottom: 0;
        left: 0;
        transform: translateY(calc(100% + 8px));
        transition: color 0.3s ease;
        user-select: none;
        cursor: pointer;

        &:hover {
            color: #53beb7;
        }

        .el-icon-sort {
            transform: rotate(90deg);
            margin-left: 4px;
        }
    }

    .show-info {
        display: flex;
        padding-bottom: 5px;
        max-width: 751px;
        overflow-x: scroll;
        overflow-y: unset;

        &::-webkit-scrollbar {
            height: 5px;
        }

        &::-webkit-scrollbar-thumb {
            background: #0000001a;
            border-radius: 5px;
        }

        &::-webkit-scrollbar-thumb:hover {
            background: #0000002a;
        }

        &::-webkit-scrollbar-corner {
            background: #fff;
        }

        &-item {
            display: flex;
            flex-direction: column;

            & + .show-info-item {
                margin-left: 8px;
                padding-left: 12px;
                border-left: 1px solid #eee;
            }

            &__suffix {
                display: inline-block;
                width: 28px;
                font-size: 14px;
                margin-left: 8px;
            }

            &__area-config {
                position: relative;
                margin-top: 20px;
                padding-top: 14px;

                &::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 1px;
                    background-color: #eee;
                }

                &::after {
                    content: '面积设置';
                    position: absolute;
                    top: 0;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    padding: 0 8px;
                    font-size: 12px;
                    line-height: 1;
                    color: #909399;
                    background-color: #fff;
                    white-space: nowrap;
                }

                .el-form-item {
                    margin-bottom: 6px;

                    &:last-child {
                        margin-bottom: 0;
                    }
                }
            }

            > .el-form-item {
                margin-bottom: 0;

                & + .el-form-item {
                    margin-top: 12px;
                }

                .el-form-item__label {
                    display: none;
                }

                .el-form-item__content {
                    display: flex;
                    align-items: center;

                    .el-select,
                    .el-input-number {
                        width: 132px;
                    }

                    .el-input {
                        &.is-active .el-input__inner,
                        .el-input__inner:focus {
                            border-color: #53beb7;
                        }

                        .el-input__inner {
                            height: 36px;
                            line-height: 36px;
                        }
                    }

                    .el-input-number {
                        .el-input__inner {
                            text-align: left;
                        }

                        .el-input-number__decrease,
                        .el-input-number__increase {
                            line-height: 17px;

                            &:hover {
                                color: #53beb7;
                            }
                        }

                        .el-input-number__decrease:hover:not(.is-disabled)
                            ~ .el-input
                            .el-input__inner:not(.is-disabled),
                        .el-input-number__increase:hover:not(.is-disabled)
                            ~ .el-input
                            .el-input__inner:not(.is-disabled) {
                            border-color: #53beb7;
                        }
                    }
                }
            }

            &__operate {
                display: flex;
                justify-content: flex-end;
                align-items: center;
                margin-top: 8px;
                padding-right: 40px;

                > span {
                    width: 62px;
                    line-height: 1.5;
                    font-size: 12px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    color: #fff;
                    background-color: #53beb7;
                    padding: 0 6px;
                    border-radius: 3px;
                    cursor: pointer;

                    & + span {
                        margin-left: 8px;
                    }

                    &.del-btn {
                        background-color: #f56c6d;
                    }

                    > i {
                        font-size: 14px;
                        margin-left: 4px;
                    }
                }
            }
        }
    }

    &__operate {
        display: flex;
        justify-content: center;
        align-items: center;
        padding-top: 8px;

        .el-button {
            padding: 6px 16px;
        }
    }
}
.custom-select-popper.show-info-item__select {
    .el-select-dropdown__wrap {
        max-height: 160px; // 最大 4 个
    }
}
</style>
