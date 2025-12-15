<template>
  <el-dialog
    v-model="dialogVisible"
    :title="title"
    width="600px"
    :close-on-click-modal="false"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      v-if="formData && fields.length > 0"
    >
      <el-form-item
        v-for="field in fields"
        :key="field.id"
        :label="field.title || field.name"
        :prop="field.id"
        :required="field.required"
      >
        <!-- 文本输入 -->
        <el-input
          v-if="field.type === 'text'"
          v-model="formData[field.id]"
          :placeholder="field.description || `请输入${field.title || field.name}`"
        />

        <!-- 数字输入 -->
        <el-input-number
          v-else-if="field.type === 'number'"
          v-model="formData[field.id]"
          :min="field.min"
          :max="field.max"
          :precision="field.precision || 0"
          :controls-position="field.precision > 0 ? 'right' : undefined"
          style="width: 100%"
        >
          <template v-if="field.unit" #append>{{ field.unit }}</template>
        </el-input-number>

        <!-- 日期选择 -->
        <el-date-picker
          v-else-if="field.type === 'date'"
          v-model="formData[field.id]"
          type="date"
          :placeholder="field.description || `请选择${field.title || field.name}`"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          style="width: 100%"
        />

        <!-- 选择器 -->
        <el-select
          v-else-if="field.type === 'select'"
          v-model="formData[field.id]"
          :placeholder="field.description || `请选择${field.title || field.name}`"
          style="width: 100%"
          clearable
        >
          <el-option
            v-for="option in field.options"
            :key="option"
            :label="option"
            :value="option"
          />
        </el-select>

        <!-- 布尔值 -->
        <el-switch
          v-else-if="field.type === 'boolean'"
          v-model="formData[field.id]"
          active-text="是"
          inactive-text="否"
        />

        <!-- 默认文本输入 -->
        <el-input
          v-else
          v-model="formData[field.id]"
          :type="getInputType(field)"
          :rows="getTextareaRows(field)"
          :placeholder="field.description || `请输入${field.title || field.name}`"
        />

        <!-- 字段描述 -->
        <div
          v-if="
            field.description &&
            field.description !== `请输入${field.title || field.name}` &&
            field.description !== `请选择${field.title || field.name}`
          "
          class="text-xs text-gray-500 mt-1"
        >
          {{ field.description }}
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="flex justify-between">
        <div>
          <el-button v-if="showReset" @click="resetForm">重置</el-button>
        </div>
        <div>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveData" :loading="saving">
            保存
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch, computed, nextTick } from "vue";
import { ElMessage } from "element-plus";

const props = defineProps({
  visible: {
    type: Boolean,
    required: true,
  },
  data: {
    type: Object,
    default: null,
  },
  fields: {
    type: Array,
    default: () => [],
  },
  title: {
    type: String,
    default: "编辑数据",
  },
  showReset: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(["update:visible", "save"]);

const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit("update:visible", val),
});

const formRef = ref(null);
const formData = ref({});
const originalData = ref({});
const saving = ref(false);

// 动态生成表单验证规则
const formRules = computed(() => {
  const rules = {};

  props.fields.forEach((field) => {
    if (field.required) {
      rules[field.id] = [
        {
          required: true,
          message: `请${field.type === "select" ? "选择" : "输入"}${
            field.title || field.name
          }`,
          trigger: field.type === "select" ? "change" : "blur",
        },
      ];
    }

    // 数字类型验证
    if (field.type === "number") {
      if (!rules[field.id]) rules[field.id] = [];

      rules[field.id].push({
        type: "number",
        message: `${field.title || field.name}必须是数字`,
        trigger: "blur",
        transform: (value) => {
          if (value === "" || value === null || value === undefined) {
            return field.required ? NaN : 0;
          }
          return Number(value);
        },
      });

      if (field.min !== undefined) {
        rules[field.id].push({
          validator: (rule, value, callback) => {
            if (
              value !== null &&
              value !== undefined &&
              value !== "" &&
              Number(value) < field.min
            ) {
              callback(new Error(`${field.title || field.name}不能小于${field.min}`));
            } else {
              callback();
            }
          },
          trigger: "blur",
        });
      }

      if (field.max !== undefined) {
        rules[field.id].push({
          validator: (rule, value, callback) => {
            if (
              value !== null &&
              value !== undefined &&
              value !== "" &&
              Number(value) > field.max
            ) {
              callback(new Error(`${field.title || field.name}不能大于${field.max}`));
            } else {
              callback();
            }
          },
          trigger: "blur",
        });
      }
    }
  });

  return rules;
});

// 监听数据变化
watch(
  () => props.data,
  (newData) => {
    if (newData) {
      // 深拷贝数据
      formData.value = JSON.parse(JSON.stringify(newData));
      originalData.value = JSON.parse(JSON.stringify(newData));

      // 确保所有字段都有初始值
      props.fields.forEach((field) => {
        if (!(field.id in formData.value)) {
          formData.value[field.id] = getDefaultValue(field);
        }
      });
    }
  },
  { immediate: true }
);

// 获取字段默认值
const getDefaultValue = (field) => {
  switch (field.type) {
    case "number":
      return null;
    case "boolean":
      return false;
    case "date":
      return null;
    case "select":
      return null;
    default:
      return "";
  }
};

// 获取输入框类型
const getInputType = (field) => {
  const displayName = field.title || field.name;
  if (
    displayName.includes("备注") ||
    displayName.includes("描述") ||
    displayName.includes("说明")
  ) {
    return "textarea";
  }
  return "text";
};

// 获取文本域行数
const getTextareaRows = (field) => {
  const displayName = field.title || field.name;
  if (
    displayName.includes("备注") ||
    displayName.includes("描述") ||
    displayName.includes("说明")
  ) {
    return 4;
  }
  return 1;
};

// 重置表单
const resetForm = () => {
  if (originalData.value) {
    formData.value = JSON.parse(JSON.stringify(originalData.value));
  }

  nextTick(() => {
    if (formRef.value) {
      formRef.value.clearValidate();
    }
  });

  ElMessage.info("已重置为原始数据");
};

// 保存数据
const saveData = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();

    saving.value = true;

    // 数据处理
    const processedData = { ...formData.value };

    // 处理数字字段
    props.fields.forEach((field) => {
      if (
        field.type === "number" &&
        processedData[field.id] !== null &&
        processedData[field.id] !== undefined
      ) {
        processedData[field.id] = Number(processedData[field.id]);
      }
    });

    emit("save", processedData);

    // 模拟保存延迟
    await new Promise((resolve) => setTimeout(resolve, 300));

    dialogVisible.value = false;
    ElMessage.success("保存成功");
  } catch (error) {
    console.error("表单验证失败:", error);
    ElMessage.error("请检查输入内容");
  } finally {
    saving.value = false;
  }
};

// 监听对话框关闭，清理验证状态
watch(dialogVisible, (visible) => {
  if (!visible && formRef.value) {
    nextTick(() => {
      formRef.value.clearValidate();
    });
  }
});
</script>

<style scoped>
:deep(.el-form-item__label) {
  font-weight: 500;
}

:deep(.el-input-number) {
  width: 100%;
}

:deep(.el-date-editor) {
  width: 100%;
}
</style>
