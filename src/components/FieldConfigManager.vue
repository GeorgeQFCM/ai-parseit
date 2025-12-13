<template>
  <div>
    <!-- 全局补充规则配置 -->
    <div class="config-section mb-6">
      <h3 class="font-semibold text-gray-700 mb-3">🌐 全局补充规则（可选）</h3>
      <div class="bg-blue-50 rounded-lg p-4">
        <el-input
          v-model="globalRules"
          type="textarea"
          :rows="3"
          placeholder="在这里输入全局的数据提取补充规则，这些规则会应用到所有字段的提取过程中..."
          @input="updateGlobalRules"
        />
        <div class="text-xs text-blue-600 mt-2">
          💡
          示例：在提取数据前，请仔细阅读整个合同内容，注意条款中的特殊说明和附加条件
        </div>
      </div>
    </div>

    <div class="flex justify-between items-center mb-4">
      <h3 class="font-semibold text-gray-700">📋 字段配置</h3>
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
        <!-- 字段格式化显示 -->
        <div class="mb-3 p-2 bg-blue-50 rounded border-l-4 border-blue-400">
          <div class="text-sm font-medium text-blue-800">
            <span class="text-xs text-blue-600">字段格式：</span>
            <code class="bg-blue-100 px-2 py-1 rounded text-blue-900">
              {{ getFieldDisplayFormat(field) }}
            </code>
          </div>
        </div>

        <div class="grid grid-cols-12 gap-3 items-start">
          <!-- 字段标题 -->
          <div class="col-span-3">
            <label class="text-xs text-gray-500 block mb-1">字段标题</label>
            <el-input
              v-model="field.title"
              placeholder="如：单价、产品名称"
              size="small"
              @input="handleTitleChange(index)"
            />
          </div>

          <!-- 字段类型 -->
          <div class="col-span-2">
            <label class="text-xs text-gray-500 block mb-1">字段类型</label>
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

          <!-- 字段提取规则 -->
          <div class="col-span-5">
            <label class="text-xs text-gray-500 block mb-1">提取规则</label>
            <el-input
              v-model="field.extractionRule"
              placeholder="具体的提取要求，默认按标题字面意思提取"
              size="small"
              @input="updateField(index)"
            />
          </div>

          <!-- 必填和操作 -->
          <div class="col-span-2">
            <label class="text-xs text-gray-500 block mb-1">设置</label>
            <div class="flex items-center gap-1">
              <el-checkbox
                v-model="field.required"
                @change="updateField(index)"
                size="small"
              >
                必填
              </el-checkbox>
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

    <!-- 动态生成的提示词预览 -->
    <div v-if="fields.length > 0" class="mt-6">
      <h4 class="font-semibold text-gray-700 mb-3">🤖 AI提示词预览</h4>
      <div
        class="bg-gray-50 rounded-lg p-4 text-sm text-gray-600 font-mono whitespace-pre-wrap max-h-96 overflow-y-auto"
      >
        {{ generatedPrompt }}
      </div>
      <div class="mt-3 text-xs text-gray-500">
        此提示词将根据您的字段配置和规则自动生成，用于AI数据提取
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
import { ref, watch, computed } from "vue";
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
  globalExtractionRules: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["update:modelValue", "update:globalExtractionRules"]);

const fields = ref([]);
const globalRules = ref("");

// 动态生成的提示词
const generatedPrompt = computed(() => {
  if (fields.value.length === 0) {
    return "请先配置字段，系统将自动生成提示词";
  }

  // 构建全局补充规则部分
  let globalRulesSection = "";
  if (globalRules.value && globalRules.value.trim()) {
    globalRulesSection = `
## 全局补充规则
${globalRules.value.trim()}
`;
  }

  // 构建结构化字段描述
  const fieldDescriptions = fields.value
    .map((field, index) => {
      // 基础字段信息
      const fieldName = field.name || "未设置";
      const fieldTitle = field.title || "未设置";
      const extractionRule = field.extractionRule || "按字面意思提取";

      // 构建类型约束信息
      let typeConstraints = "";
      if (field.type === "number") {
        typeConstraints = `数字类型`;
        if (field.unit) typeConstraints += `，单位：${field.unit}`;
        if (field.precision !== undefined)
          typeConstraints += `，小数位：${field.precision}`;
        if (field.min !== undefined)
          typeConstraints += `，最小值：${field.min}`;
        if (field.max !== undefined)
          typeConstraints += `，最大值：${field.max}`;
      } else if (field.type === "date") {
        typeConstraints = "日期类型，严格使用YYYY-MM-DD格式";
      } else if (field.type === "boolean") {
        typeConstraints = "布尔类型，只能返回true或false";
      } else if (
        field.type === "select" &&
        field.options &&
        field.options.length > 0
      ) {
        typeConstraints = `选择类型，只能从以下选项中选择：${field.options.join(
          "、"
        )}`;
      } else {
        typeConstraints = "文本类型";
      }

      // 必填标识
      const requiredFlag = field.required ? "[必填]" : "[可选]";

      return `${index + 1}. [${fieldName}]-[${fieldTitle}]-[${extractionRule}]
   数据类型：${typeConstraints} ${requiredFlag}`;
    })
    .join("\n\n");

  // 生成类型化示例数据
  const exampleData = {};
  fields.value.forEach((field) => {
    const fieldName = field.name || `field${fields.value.indexOf(field) + 1}`;
    switch (field.type) {
      case "number":
        if (field.unit === "元" || field.unit === "￥") {
          exampleData[fieldName] = 100.5;
        } else if (field.unit === "%") {
          exampleData[fieldName] = 15.5;
        } else {
          exampleData[fieldName] = field.precision > 0 ? 1.23 : 1;
        }
        break;
      case "date":
        exampleData[fieldName] = "2024-01-15";
        break;
      case "boolean":
        exampleData[fieldName] = true;
        break;
      case "select":
        exampleData[fieldName] = field.options?.[0] || "选项1";
        break;
      default:
        exampleData[fieldName] = `示例${field.title || "文本"}`;
    }
  });

  return `# PDF数据提取任务

你是一个专业的PDF数据提取专家。请严格按照以下要求从PDF内容中提取结构化数据。${globalRulesSection}

## 字段提取要求

${fieldDescriptions}

## 数据提取规则

1. **输出格式**：必须返回标准JSON数组格式，每个元素代表一条完整记录
2. **数据类型**：严格按照字段类型要求返回对应格式的数据
3. **必填字段**：标记为[必填]的字段不能为空，如果找不到对应信息请仔细查找
4. **可选字段**：标记为[可选]的字段如果找不到信息可以设置为null
5. **多条记录**：如果PDF中包含多条记录，请分别提取每一条
6. **数据验证**：
   - 数字类型必须返回数字格式，不能包含文字
   - 日期必须使用YYYY-MM-DD格式
   - 选择类型必须从指定选项中选择
   - 布尔类型只能是true或false

## 输出要求

- 只返回JSON数组，不要包含任何解释性文字
- 确保JSON格式正确，可以被程序解析
- 如果整个PDF都没有找到相关数据，返回空数组[]

## 示例输出格式

\`\`\`json
[
  ${JSON.stringify(exampleData, null, 2)}
]
\`\`\`

---

请开始分析以下PDF内容：`;
});

// 预设模板
const templates = ref([
  {
    id: "contract",
    name: "合同订单",
    icon: "Document",
    fields: [
      {
        id: "orderNo",
        name: "field1",
        title: "订单编号",
        type: "text",
        required: true,
        description: "订单编号或合同编号",
        extractionRule: "提取 订单编号 对应的值",
      },
      {
        id: "name",
        name: "field2",
        title: "产品名称",
        type: "text",
        required: true,
        description: "产品或服务名称",
        extractionRule: "提取 产品名称 对应的值",
      },
      {
        id: "color",
        name: "field3",
        title: "颜色",
        type: "text",
        required: false,
        description: "产品颜色",
        extractionRule: "提取 颜色 对应的值",
      },
      {
        id: "package",
        name: "field4",
        title: "包装",
        type: "text",
        required: false,
        description: "包装方式",
        extractionRule: "提取 包装 对应的值",
      },
      {
        id: "quantity",
        name: "field5",
        title: "数量",
        type: "number",
        required: true,
        description: "产品数量",
        min: 0,
        precision: 0,
        extractionRule: "提取 数量 对应的值",
      },
      {
        id: "unit",
        name: "field6",
        title: "单位",
        type: "text",
        required: false,
        description: "计量单位",
        extractionRule: "提取 单位 对应的值",
      },
      {
        id: "unitPrice",
        name: "field7",
        title: "单价",
        type: "number",
        required: true,
        extractionRule:
          "单价需要包含所有附加费用（如开模费、定制费、加工费、运费、安装费等）",
        min: 0,
        precision: 2,
        unit: "元",
      },
      {
        id: "remark",
        name: "field8",
        title: "备注",
        type: "text",
        required: false,
        description: "备注信息",
        extractionRule: "提取 备注 对应的值",
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
        name: "field1",
        title: "发票号码",
        type: "text",
        required: true,
        description: "发票编号",
        extractionRule: "提取 发票号码 对应的值",
      },
      {
        id: "date",
        name: "field2",
        title: "开票日期",
        type: "date",
        required: true,
        description: "发票开具日期",
        extractionRule: "提取 开票日期 对应的值",
      },
      {
        id: "seller",
        name: "field3",
        title: "销售方",
        type: "text",
        required: true,
        description: "销售方名称",
        extractionRule: "提取 销售方 对应的值",
      },
      {
        id: "buyer",
        name: "field4",
        title: "购买方",
        type: "text",
        required: true,
        description: "购买方名称",
        extractionRule: "提取 购买方 对应的值",
      },
      {
        id: "itemName",
        name: "field5",
        title: "项目名称",
        type: "text",
        required: true,
        description: "商品或服务名称",
        extractionRule: "提取 项目名称 对应的值",
      },
      {
        id: "amount",
        name: "field6",
        title: "金额",
        type: "number",
        required: true,
        description: "不含税金额",
        min: 0,
        precision: 2,
        unit: "元",
        extractionRule: "提取 金额 对应的值",
      },
      {
        id: "taxRate",
        name: "field7",
        title: "税率",
        type: "number",
        required: false,
        description: "税率",
        min: 0,
        max: 100,
        precision: 2,
        unit: "%",
        extractionRule: "提取 税率 对应的值",
      },
      {
        id: "totalAmount",
        name: "field8",
        title: "价税合计",
        type: "number",
        required: true,
        description: "含税总金额",
        min: 0,
        precision: 2,
        unit: "元",
        extractionRule: "提取 价税合计 对应的值",
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
        name: "field1",
        title: "产品编码",
        type: "text",
        required: true,
        description: "产品编号或SKU",
        extractionRule: "提取 产品编码 对应的值",
      },
      {
        id: "productName",
        name: "field2",
        title: "产品名称",
        type: "text",
        required: true,
        description: "产品名称",
        extractionRule: "提取 产品名称 对应的值",
      },
      {
        id: "category",
        name: "field3",
        title: "产品分类",
        type: "text",
        required: false,
        description: "产品分类",
        extractionRule: "提取 产品分类 对应的值",
      },
      {
        id: "specification",
        name: "field4",
        title: "规格型号",
        type: "text",
        required: false,
        description: "产品规格",
        extractionRule: "提取 规格型号 对应的值",
      },
      {
        id: "price",
        name: "field5",
        title: "价格",
        type: "number",
        required: true,
        description: "产品价格",
        min: 0,
        precision: 2,
        unit: "元",
        extractionRule: "提取 价格 对应的值",
      },
      {
        id: "stock",
        name: "field6",
        title: "库存",
        type: "number",
        required: false,
        description: "库存数量",
        min: 0,
        precision: 0,
        extractionRule: "提取 库存 对应的值",
      },
      {
        id: "description",
        name: "field7",
        title: "产品描述",
        type: "text",
        required: false,
        description: "产品详细描述",
        extractionRule: "提取 产品描述 对应的值",
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
        name: "field1",
        title: "报告期间",
        type: "text",
        required: true,
        description: "报告期间",
        extractionRule: "提取 报告期间 对应的值",
      },
      {
        id: "itemName",
        name: "field2",
        title: "项目名称",
        type: "text",
        required: true,
        description: "财务项目名称",
        extractionRule: "提取 项目名称 对应的值",
      },
      {
        id: "currentAmount",
        name: "field3",
        title: "本期金额",
        type: "number",
        required: true,
        description: "本期金额",
        precision: 2,
        unit: "元",
        extractionRule: "提取 本期金额 对应的值",
      },
      {
        id: "previousAmount",
        name: "field4",
        title: "上期金额",
        type: "number",
        required: false,
        description: "上期金额",
        precision: 2,
        unit: "元",
        extractionRule: "提取 上期金额 对应的值",
      },
      {
        id: "changeRate",
        name: "field5",
        title: "变动率",
        type: "number",
        required: false,
        description: "同比变动率",
        precision: 2,
        unit: "%",
        extractionRule: "提取 变动率 对应的值",
      },
      {
        id: "note",
        name: "field6",
        title: "备注",
        type: "text",
        required: false,
        description: "备注说明",
        extractionRule: "提取 备注 对应的值",
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
    } else if (newValue && newValue.length === 0 && fields.value.length === 0) {
      // 如果外部数据为空且当前字段也为空，则初始化为合同订单模板
      initializeWithContractTemplate();
    }
  },
  { immediate: true }
);

// 监听全局规则变化
watch(
  () => props.globalExtractionRules,
  (newValue) => {
    globalRules.value = newValue || "";
  },
  { immediate: true }
);

// 生成唯一ID
const generateId = () => {
  return "field_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
};

// 生成下一个可用的字段名称（field1, field2, field3...）
const generateNextFieldName = () => {
  const existingNumbers = fields.value
    .map((field) => {
      const match = field.name?.match(/^field(\d+)$/);
      return match ? parseInt(match[1]) : 0;
    })
    .filter((num) => num > 0);

  const maxNumber =
    existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
  return `field${maxNumber + 1}`;
};

// 添加字段
const addField = () => {
  const newField = {
    id: generateId(),
    name: generateNextFieldName(),
    title: "",
    type: "text",
    required: false,
    description: "",
    extractionRule: "",
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

// 处理标题变化
const handleTitleChange = (index) => {
  const field = fields.value[index];
  if (field.title) {
    // 实时更新提取规则，始终保持同步
    field.extractionRule = `提取 ${field.title} 对应的值`;
  } else {
    // 如果标题为空，清空提取规则
    field.extractionRule = "";
  }
  updateField(index);
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
  // 清空现有字段
  fields.value = [];

  // 逐个添加模板字段，使用简单的field序号命名
  template.fields.forEach((templateField) => {
    const newField = {
      ...templateField,
      id: generateId(),
      name: generateNextFieldName(),
      options: templateField.options || [],
      showAddOption: false,
      newOption: "",
    };
    fields.value.push(newField);
  });

  updateParent();
  ElMessage.success(`已加载 ${template.name} 模板`);
};

// 更新全局规则
const updateGlobalRules = () => {
  emit("update:globalExtractionRules", globalRules.value);
};

// 获取字段格式化显示
const getFieldDisplayFormat = (field) => {
  const fieldName = field.name || "未设置";
  const fieldTitle = field.title || "未设置";
  const extractionRule = field.extractionRule || "按字面意思提取";

  return `[${fieldName}]-[${fieldTitle}]-[${extractionRule}]`;
};

// 初始化为合同订单模板
const initializeWithContractTemplate = () => {
  const contractTemplate = templates.value.find((t) => t.id === "contract");
  if (contractTemplate) {
    loadTemplate(contractTemplate);
  }
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
