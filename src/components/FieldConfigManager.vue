<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <h3 class="font-semibold text-gray-700">字段配置</h3>
      <el-button type="primary" size="small" @click="addField">
        <el-icon><Plus /></el-icon> 添加字段
      </el-button>
    </div>

    <div class="space-y-3">
      <div
        v-for="(field, index) in fields"
        :key="field.id"
        class="field-config-item border rounded-lg p-4"
      >
        <div class="grid grid-cols-12 gap-3 items-center">
          <!-- 字段名称 -->
          <div class="col-span-3">
            <el-input
              v-model="field.name"
              placeholder="字段名称"
              size="small"
              @input="updateField(index)"
            />
          </div>

          <!-- 字段类型 -->
          <div class="col-span-2">
            <el-select
              v-model="field.type"
              placeholder="类型"
              size="small"
              @change="updateField(index)"
            >
              <el-option label="文本" value="text" />
              <el-option label="数字" value="number" />
              <el-option label="日期" value="date" />
              <el-option label="选择" value="select" />
              <el-option label="布尔" value="boolean" />
            </el-select>
          </div>

          <!-- 是否必填 -->
          <div class="col-span-1">
            <el-checkbox v-model="field.required" @change="updateField(index)">
              必填
            </el-checkbox>
          </div>

          <!-- 字段描述 -->
          <div class="col-span-4">
            <el-input
              v-model="field.description"
              placeholder="字段描述（用于AI提示）"
              size="small"
              @input="updateField(index)"
            />
          </div>

          <!-- 操作按钮 -->
          <div class="col-span-2 flex gap-1">
            <el-button
              type="primary"
              size="small"
              circle
              @click="moveField(index, -1)"
              :disabled="index === 0"
            >
              <el-icon><ArrowUp /></el-icon>
            </el-button>
            <el-button
              type="primary"
              size="small"
              circle
              @click="moveField(index, 1)"
              :disabled="index === fields.length - 1"
            >
              <el-icon><ArrowDown /></el-icon>
            </el-button>
            <el-button
              type="danger"
              size="small"
              circle
              @click="removeField(index)"
            >
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </div>

        <!-- 选择类型的选项配置 -->
        <div v-if="field.type === 'select'" class="mt-3">
          <div class="text-sm text-gray-600 mb-2">选项配置：</div>
          <div class="flex flex-wrap gap-2">
            <el-tag
              v-for="(option, optIndex) in field.options"
              :key="optIndex"
              closable
              @close="removeOption(index, optIndex)"
            >
              {{ option }}
            </el-tag>
            <el-input
              v-if="field.showAddOption"
              v-model="field.newOption"
              size="small"
              style="width: 100px"
              @keyup.enter="addOption(index)"
              @blur="addOption(index)"
            />
            <el-button
              v-else
              size="small"
              type="primary"
              plain
              @click="field.showAddOption = true"
            >
              + 添加选项
            </el-button>
          </div>
        </div>

        <!-- 数字类型的配置 -->
        <div v-if="field.type === 'number'" class="mt-3">
          <div class="grid grid-cols-4 gap-2">
            <div>
              <el-input-number
                v-model="field.min"
                placeholder="最小值"
                size="small"
                :controls="false"
                @change="updateField(index)"
              />
            </div>
            <div>
              <el-input-number
                v-model="field.max"
                placeholder="最大值"
                size="small"
                :controls="false"
                @change="updateField(index)"
              />
            </div>
            <div>
              <el-input-number
                v-model="field.precision"
                placeholder="小数位"
                size="small"
                :min="0"
                :max="10"
                :controls="false"
                @change="updateField(index)"
              />
            </div>
            <div>
              <el-input
                v-model="field.unit"
                placeholder="单位"
                size="small"
                @input="updateField(index)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 预设模板 -->
    <div class="mt-6">
      <h4 class="font-semibold text-gray-700 mb-3">预设模板</h4>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <el-button
          v-for="template in templates"
          :key="template.id"
          @click="loadTemplate(template)"
          class="template-btn"
        >
          <div class="text-center">
            <el-icon :size="20">
              <component :is="template.icon" />
            </el-icon>
            <div class="text-sm mt-1">{{ template.name }}</div>
          </div>
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import { ElMessage } from "element-plus";
import {
  Plus,
  ArrowUp,
  ArrowDown,
  Delete,
  Document,
  DocumentCopy,
  Goods,
  DataAnalysis,
  Files,
} from "@element-plus/icons-vue";

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["update:modelValue"]);

const fields = ref([]);

// 预设模板
const templates = ref([
  {
    id: "contract",
    name: "合同订单",
    icon: "Document",
    fields: [
      {
        id: "orderNo",
        name: "订单编号",
        type: "text",
        required: true,
        description: "订单编号或合同编号",
      },
      {
        id: "name",
        name: "产品名称",
        type: "text",
        required: true,
        description: "产品或服务名称",
      },
      {
        id: "color",
        name: "颜色",
        type: "text",
        required: false,
        description: "产品颜色",
      },
      {
        id: "package",
        name: "包装",
        type: "text",
        required: false,
        description: "包装方式",
      },
      {
        id: "quantity",
        name: "数量",
        type: "number",
        required: true,
        description: "产品数量",
        min: 0,
        precision: 0,
      },
      {
        id: "unit",
        name: "单位",
        type: "text",
        required: false,
        description: "计量单位",
      },
      {
        id: "unitPrice",
        name: "单价",
        type: "number",
        required: true,
        description: "单价金额",
        min: 0,
        precision: 2,
        unit: "元",
      },
      {
        id: "remark",
        name: "备注",
        type: "text",
        required: false,
        description: "备注信息",
      },
    ],
  },
  {
    id: "invoice",
    name: "发票账单",
    icon: "DocumentCopy",
    fields: [
      {
        id: "invoiceNo",
        name: "发票号码",
        type: "text",
        required: true,
        description: "发票编号",
      },
      {
        id: "date",
        name: "开票日期",
        type: "date",
        required: true,
        description: "发票开具日期",
      },
      {
        id: "seller",
        name: "销售方",
        type: "text",
        required: true,
        description: "销售方名称",
      },
      {
        id: "buyer",
        name: "购买方",
        type: "text",
        required: true,
        description: "购买方名称",
      },
      {
        id: "itemName",
        name: "项目名称",
        type: "text",
        required: true,
        description: "商品或服务名称",
      },
      {
        id: "amount",
        name: "金额",
        type: "number",
        required: true,
        description: "不含税金额",
        min: 0,
        precision: 2,
        unit: "元",
      },
      {
        id: "taxRate",
        name: "税率",
        type: "number",
        required: false,
        description: "税率",
        min: 0,
        max: 100,
        precision: 2,
        unit: "%",
      },
      {
        id: "totalAmount",
        name: "价税合计",
        type: "number",
        required: true,
        description: "含税总金额",
        min: 0,
        precision: 2,
        unit: "元",
      },
    ],
  },
  {
    id: "catalog",
    name: "产品目录",
    icon: "Goods",
    fields: [
      {
        id: "productCode",
        name: "产品编码",
        type: "text",
        required: true,
        description: "产品编号或SKU",
      },
      {
        id: "productName",
        name: "产品名称",
        type: "text",
        required: true,
        description: "产品名称",
      },
      {
        id: "category",
        name: "产品分类",
        type: "text",
        required: false,
        description: "产品分类",
      },
      {
        id: "specification",
        name: "规格型号",
        type: "text",
        required: false,
        description: "产品规格",
      },
      {
        id: "price",
        name: "价格",
        type: "number",
        required: true,
        description: "产品价格",
        min: 0,
        precision: 2,
        unit: "元",
      },
      {
        id: "stock",
        name: "库存",
        type: "number",
        required: false,
        description: "库存数量",
        min: 0,
        precision: 0,
      },
      {
        id: "description",
        name: "产品描述",
        type: "text",
        required: false,
        description: "产品详细描述",
      },
    ],
  },
  {
    id: "report",
    name: "财务报表",
    icon: "DataAnalysis",
    fields: [
      {
        id: "period",
        name: "报告期间",
        type: "text",
        required: true,
        description: "报告期间",
      },
      {
        id: "itemName",
        name: "项目名称",
        type: "text",
        required: true,
        description: "财务项目名称",
      },
      {
        id: "currentAmount",
        name: "本期金额",
        type: "number",
        required: true,
        description: "本期金额",
        precision: 2,
        unit: "元",
      },
      {
        id: "previousAmount",
        name: "上期金额",
        type: "number",
        required: false,
        description: "上期金额",
        precision: 2,
        unit: "元",
      },
      {
        id: "changeRate",
        name: "变动率",
        type: "number",
        required: false,
        description: "同比变动率",
        precision: 2,
        unit: "%",
      },
      {
        id: "note",
        name: "备注",
        type: "text",
        required: false,
        description: "备注说明",
      },
    ],
  },
]);

// 监听外部数据变化
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue && newValue.length > 0) {
      fields.value = newValue.map((field) => ({
        ...field,
        options: field.options || [],
        showAddOption: false,
        newOption: "",
      }));
    }
  },
  { immediate: true }
);

// 生成唯一ID
const generateId = () => {
  return "field_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
};

// 添加字段
const addField = () => {
  const newField = {
    id: generateId(),
    name: "",
    type: "text",
    required: false,
    description: "",
    options: [],
    showAddOption: false,
    newOption: "",
  };
  fields.value.push(newField);
  updateParent();
};

// 删除字段
const removeField = (index) => {
  fields.value.splice(index, 1);
  updateParent();
};

// 移动字段
const moveField = (index, direction) => {
  const newIndex = index + direction;
  if (newIndex >= 0 && newIndex < fields.value.length) {
    const field = fields.value.splice(index, 1)[0];
    fields.value.splice(newIndex, 0, field);
    updateParent();
  }
};

// 更新字段
const updateField = (index) => {
  updateParent();
};

// 添加选项
const addOption = (fieldIndex) => {
  const field = fields.value[fieldIndex];
  if (field.newOption && field.newOption.trim()) {
    if (!field.options) field.options = [];
    field.options.push(field.newOption.trim());
    field.newOption = "";
    field.showAddOption = false;
    updateParent();
  } else {
    field.showAddOption = false;
  }
};

// 删除选项
const removeOption = (fieldIndex, optionIndex) => {
  fields.value[fieldIndex].options.splice(optionIndex, 1);
  updateParent();
};

// 加载模板
const loadTemplate = (template) => {
  fields.value = template.fields.map((field) => ({
    ...field,
    id: generateId(),
    options: field.options || [],
    showAddOption: false,
    newOption: "",
  }));
  updateParent();
  ElMessage.success(`已加载 ${template.name} 模板`);
};

// 更新父组件
const updateParent = () => {
  const cleanFields = fields.value.map((field) => {
    const { showAddOption, newOption, ...cleanField } = field;
    return cleanField;
  });
  emit("update:modelValue", cleanFields);
};
</script>

<style scoped>
.field-config-item {
  background: #fafafa;
  border: 1px solid #e5e7eb;
}

.template-btn {
  height: 80px;
  border: 2px dashed #d1d5db;
  background: white;
}

.template-btn:hover {
  border-color: #3b82f6;
  background: #eff6ff;
}
</style>
