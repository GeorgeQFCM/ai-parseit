<template>
  <div>
    <h2 class="section-title">PDF文档上传</h2>

    <!-- PDF Upload Zone -->
    <div
      class="upload-zone"
      :class="{ dragover: isDragging }"
      @dragover.prevent="isDragging = true"
      @dragleave="isDragging = false"
      @drop.prevent="handleDrop"
    >
      <el-icon :size="48" color="#9ca3af"><FolderAdd /></el-icon>
      <p class="text-lg font-medium text-gray-600 mt-4">拖拽PDF文档到此处</p>
      <p class="text-sm text-gray-400 mt-2">支持多文件上传，单文件最大 20MB</p>
      <el-button type="primary" class="mt-4" @click="triggerUpload">
        <el-icon><FolderOpened /></el-icon> 选择文件
      </el-button>
      <input
        ref="fileInput"
        type="file"
        accept=".pdf"
        multiple
        @change="handleFileSelect"
        style="display: none"
      />
    </div>

    <!-- Configuration Status -->
    <div v-if="showConfigStatus" class="mt-4 p-4 bg-blue-50 rounded-lg">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <el-icon :size="20" color="#3b82f6"><InfoFilled /></el-icon>
          <div>
            <div class="font-medium text-blue-800">配置状态</div>
            <div class="text-sm text-blue-600">
              字段配置: {{ fieldConfig.length > 0 ? "已配置" : "未配置" }} |
              AI配置: {{ isAiConfigured ? "已配置" : "未配置" }}
            </div>
          </div>
        </div>
        <div class="flex gap-2">
          <el-button
            v-if="fieldConfig.length === 0"
            size="small"
            type="primary"
            @click="$emit('switch-to-field-config')"
          >
            配置字段
          </el-button>
          <el-button
            v-if="!isAiConfigured"
            size="small"
            type="success"
            @click="$emit('switch-to-ai-config')"
          >
            配置AI
          </el-button>
        </div>
      </div>
    </div>

    <!-- PDF List -->
    <div v-if="pdfFiles.length > 0" class="mt-6">
      <div class="flex justify-between items-center mb-4">
        <h3 class="section-title mb-0">已上传PDF ({{ pdfFiles.length }})</h3>
        <div class="flex gap-2">
          <el-button
            type="success"
            @click="extractAllPdfs"
            :loading="isExtractingAll"
            :disabled="!canExtract"
          >
            <el-icon><MagicStick /></el-icon> AI批量提取
          </el-button>
          <el-button type="danger" plain @click="$emit('clear-all')">
            <el-icon><Delete /></el-icon> 清除全部
          </el-button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div v-for="(pdf, idx) in pdfFiles" :key="idx" class="pdf-card">
          <div class="flex justify-between items-start">
            <div class="flex items-center gap-3 flex-1">
              <div
                class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                :class="getPdfTypeClass(pdf.type)"
              >
                <el-icon :size="20" color="white">
                  <component :is="getPdfTypeIcon(pdf.type)" />
                </el-icon>
              </div>
              <div class="flex-1 min-w-0">
                <el-tooltip
                  :content="pdf.name"
                  placement="top"
                  :disabled="pdf.name.length <= 30"
                >
                  <p class="font-medium text-gray-800 truncate">
                    {{ pdf.name }}
                  </p>
                </el-tooltip>
                <p class="text-xs text-gray-500">
                  {{ formatFileSize(pdf.size) }} • {{ pdf.type || "未分类" }}
                </p>
              </div>
            </div>
            <div class="flex gap-1">
              <el-button
                type="primary"
                size="small"
                circle
                @click="$emit('preview-pdf', pdf)"
              >
                查看
              </el-button>
              <el-button
                type="success"
                size="small"
                circle
                @click="extractPdf(pdf)"
                :loading="pdf.extracting"
                :disabled="!canExtract"
              >
                提取
              </el-button>
              <el-button
                type="danger"
                size="small"
                circle
                @click="$emit('remove-pdf', idx)"
              >
                <el-icon :size="14"><Close /></el-icon>
              </el-button>
            </div>
          </div>

          <!-- Extraction Status -->
          <div v-if="pdf.extracted" class="mt-3 pt-3 border-t">
            <div class="flex items-center gap-2 text-green-600 text-sm">
              <el-icon><CircleCheckFilled /></el-icon>
              <span>已提取 • {{ pdf.extractedData?.length || 0 }} 条记录</span>
            </div>
            <div
              v-if="pdf.extractedData && pdf.extractedData.length"
              class="mt-2"
            >
              <el-tag
                v-for="(item, itemIndex) in pdf.extractedData.slice(0, 3)"
                :key="itemIndex"
                class="mr-1 mb-1"
                size="small"
              >
                {{ getDisplayText(item) }}
              </el-tag>
              <el-tag
                v-if="pdf.extractedData.length > 3"
                size="small"
                type="info"
              >
                +{{ pdf.extractedData.length - 3 }} 更多
              </el-tag>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Extracted Data Table -->
    <div v-if="allExtractedData.length > 0" class="mt-6">
      <h3 class="section-title">提取结果汇总</h3>
      <DynamicTable
        :data="allExtractedData"
        :fields="fieldConfig"
        @edit="handleEditData"
        @delete="handleDeleteData"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { ElMessage } from "element-plus";
import {
  FolderAdd,
  FolderOpened,
  MagicStick,
  Delete,
  Document,
  DocumentCopy,
  Goods,
  DataAnalysis,
  Files,
  Close,
  CircleCheckFilled,
  InfoFilled,
} from "@element-plus/icons-vue";
import * as pdfjsLib from "pdfjs-dist";
import DynamicTable from "./DynamicTable.vue";

const props = defineProps({
  pdfFiles: {
    type: Array,
    required: true,
  },
  aiConfig: {
    type: Object,
    required: true,
  },
  fieldConfig: {
    type: Array,
    required: true,
  },
});

const emit = defineEmits([
  "extract-pdf",
  "extract-all",
  "remove-pdf",
  "clear-all",
  "preview-pdf",
  "edit-data",
  "switch-to-ai-config",
  "switch-to-field-config",
]);

const fileInput = ref(null);
const isDragging = ref(false);
const isExtractingAll = ref(false);

// 计算属性
const isAiConfigured = computed(() => {
  return (
    props.aiConfig.apiUrl && props.aiConfig.apiKey && props.aiConfig.apiModel
  );
});

const canExtract = computed(() => {
  return isAiConfigured.value && props.fieldConfig.length > 0;
});

const showConfigStatus = computed(() => {
  return !isAiConfigured.value || props.fieldConfig.length === 0;
});

const allExtractedData = computed(() => {
  const data = [];
  props.pdfFiles.forEach((pdf) => {
    if (pdf.extractedData && pdf.extractedData.length) {
      pdf.extractedData.forEach((item) => {
        data.push({
          ...item,
          documentName: pdf.name,
          documentType: pdf.type || "未知",
        });
      });
    }
  });
  return data;
});

// 方法
const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
};

const getPdfTypeClass = (type) => {
  const typeClasses = {
    合同订单: "bg-blue-500",
    发票账单: "bg-green-500",
    产品目录: "bg-purple-500",
    财务报表: "bg-orange-500",
  };
  return typeClasses[type] || "bg-gray-500";
};

const getPdfTypeIcon = (type) => {
  const typeIcons = {
    合同订单: "Document",
    发票账单: "DocumentCopy",
    产品目录: "Goods",
    财务报表: "DataAnalysis",
  };
  return typeIcons[type] || "Files";
};

const getDisplayText = (item) => {
  // 根据字段配置显示主要信息
  const mainFields = props.fieldConfig.filter((f) => f.required).slice(0, 2);
  if (mainFields.length > 0) {
    const values = mainFields.map((field) => item[field.id]).filter((v) => v);
    return values.join(" - ") || "数据项";
  }
  return "数据项";
};

const triggerUpload = () => {
  fileInput.value.click();
};

const handleFileSelect = (e) => {
  const files = Array.from(e.target.files);
  files.forEach(processFile);
  e.target.value = "";
};

const handleDrop = (e) => {
  isDragging.value = false;
  const files = Array.from(e.dataTransfer.files);
  files.forEach(processFile);
};

const processFile = async (file) => {
  if (file.type !== "application/pdf") {
    ElMessage.error(`${file.name} 不是PDF文件`);
    return;
  }

  if (file.size > 20 * 1024 * 1024) {
    ElMessage.error(`${file.name} 超过20MB限制`);
    return;
  }

  if (props.pdfFiles.some((pdf) => pdf.name === file.name)) {
    ElMessage.warning(`${file.name} 已存在`);
    return;
  }

  const arrayBuffer = await file.arrayBuffer();
  const base64 = btoa(
    new Uint8Array(arrayBuffer).reduce(
      (data, byte) => data + String.fromCharCode(byte),
      ""
    )
  );

  props.pdfFiles.push({
    name: file.name,
    size: file.size,
    type: detectPdfType(file.name),
    data: base64,
    uploadTime: new Date().toLocaleString(),
    extracted: false,
    extracting: false,
    extractedData: [],
  });

  ElMessage.success(`${file.name} 上传成功`);
};

const detectPdfType = (filename) => {
  const name = filename.toLowerCase();
  if (
    name.includes("合同") ||
    name.includes("订单") ||
    name.includes("contract")
  ) {
    return "合同订单";
  }
  if (
    name.includes("发票") ||
    name.includes("账单") ||
    name.includes("invoice")
  ) {
    return "发票账单";
  }
  if (
    name.includes("目录") ||
    name.includes("产品") ||
    name.includes("catalog")
  ) {
    return "产品目录";
  }
  if (
    name.includes("报表") ||
    name.includes("财务") ||
    name.includes("report")
  ) {
    return "财务报表";
  }
  return null;
};

const extractPdf = async (pdf) => {
  if (!canExtract.value) {
    ElMessage.warning("请先完成AI和字段配置");
    return;
  }

  pdf.extracting = true;

  try {
    const pdfText = await extractPdfText(pdf);
    const result = await callAiApi(pdfText);

    if (result && Array.isArray(result)) {
      pdf.extractedData = result;
      pdf.extracted = true;
      ElMessage.success(`${pdf.name} 提取成功，共 ${result.length} 条记录`);
    } else {
      throw new Error("AI返回数据格式错误");
    }
  } catch (error) {
    console.error("提取失败:", error);
    ElMessage.error("提取失败: " + error.message);
  } finally {
    pdf.extracting = false;
  }
};

const extractPdfText = async (pdf) => {
  const binary = atob(pdf.data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  const pdfDoc = await pdfjsLib.getDocument({ data: bytes }).promise;
  let text = "";

  for (let i = 1; i <= pdfDoc.numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((item) => item.str).join(" ") + "\n";
  }

  return text;
};

const generatePrompt = (pdfText) => {
  const fieldDescriptions = props.fieldConfig
    .map((field) => {
      // 使用title作为显示名称
      let desc = `- ${field.title || field.name}`;
      if (field.type === "number") {
        desc += ` (数字类型${field.unit ? `，单位：${field.unit}` : ""})`;
      } else if (field.type === "date") {
        desc += " (日期类型，格式：YYYY-MM-DD)";
      } else if (field.type === "boolean") {
        desc += " (布尔类型，true/false)";
      } else if (field.type === "select" && field.options) {
        desc += ` (选择类型，可选值：${field.options.join("、")})`;
      }
      if (field.required) {
        desc += " [必填]";
      }
      if (field.description) {
        desc += ` - ${field.description}`;
      }
      return desc;
    })
    .join("\n");

  const exampleData = {};
  props.fieldConfig.forEach((field) => {
    // 使用title作为键名，如果没有title则使用name
    const keyName = field.title || field.name;
    switch (field.type) {
      case "number":
        exampleData[keyName] = field.unit === "元" ? 100.0 : 1;
        break;
      case "date":
        exampleData[keyName] = "2024-01-01";
        break;
      case "boolean":
        exampleData[keyName] = true;
        break;
      case "select":
        exampleData[keyName] = field.options?.[0] || "选项1";
        break;
      default:
        exampleData[keyName] = `示例${keyName}`;
    }
  });

  return `你是一个专业的PDF数据提取助手。请从以下PDF内容中提取信息，并以JSON数组格式返回。

需要提取的字段：
${fieldDescriptions}

注意事项：
- 返回JSON数组，每个元素代表一条记录
- 使用中文字段名作为JSON的键名
- 如果有多条记录，请分别提取
- 如果字段信息不完整或找不到，用null表示
- 数字类型请确保返回数字格式
- 日期类型请使用YYYY-MM-DD格式
- 仅返回JSON数组，不要其他说明文字

示例输出格式：
[
  ${JSON.stringify(exampleData, null, 2)}
]

PDF内容：
${pdfText}`;
};

const callAiApi = async (pdfText, retryCount = 0) => {
  const prompt = props.aiConfig.prompt || generatePrompt(pdfText);
  const finalPrompt = props.aiConfig.prompt
    ? `${prompt}\n\nPDF内容：\n${pdfText}`
    : prompt;

  // 创建中文字段名（title）到字段ID的映射
  const mapChineseToFieldId = (data) => {
    const titleToId = {};
    const nameToId = {};
    props.fieldConfig.forEach(field => {
      // 优先使用title作为映射键
      if (field.title) {
        titleToId[field.title] = field.id;
      }
      // 同时保留name作为备选
      if (field.name) {
        nameToId[field.name] = field.id;
      }
    });
    
    return data.map(item => {
      const mappedItem = {};
      Object.keys(item).forEach(key => {
        // 优先使用title映射，其次使用name映射，最后保持原键名
        const fieldId = titleToId[key] || nameToId[key] || key;
        mappedItem[fieldId] = item[key];
      });
      return mappedItem;
    });
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      props.aiConfig.timeout * 1000
    );

    const response = await fetch(props.aiConfig.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${props.aiConfig.apiKey}`,
      },
      body: JSON.stringify({
        model: props.aiConfig.apiModel,
        messages: [{ role: "user", content: finalPrompt }],
        temperature: 0.1,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || data.content || "";

    // 尝试解析JSON数组
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      const arrayResult = Array.isArray(result) ? result : [result];
      // 将中文字段名映射回字段ID
      return mapChineseToFieldId(arrayResult);
    }

    // 如果没有找到数组，尝试解析单个对象
    const objMatch = content.match(/\{[\s\S]*\}/);
    if (objMatch) {
      const result = JSON.parse(objMatch[0]);
      // 将中文字段名映射回字段ID
      return mapChineseToFieldId([result]);
    }

    throw new Error("未能解析AI返回的JSON数据");
  } catch (error) {
    if (retryCount < props.aiConfig.retryCount) {
      console.log(`重试第 ${retryCount + 1} 次...`);
      await new Promise((r) => setTimeout(r, 1000));
      return callAiApi(pdfText, retryCount + 1);
    }
    throw error;
  }
};

const extractAllPdfs = async () => {
  const unextracted = props.pdfFiles.filter((pdf) => !pdf.extracted);
  if (unextracted.length === 0) {
    ElMessage.info("所有PDF已提取完成");
    return;
  }

  if (!canExtract.value) {
    ElMessage.warning("请先完成AI和字段配置");
    return;
  }

  isExtractingAll.value = true;

  for (const pdf of unextracted) {
    await extractPdf(pdf);
    await new Promise((r) => setTimeout(r, 500));
  }

  isExtractingAll.value = false;
  ElMessage.success("批量提取完成");
};

const handleEditData = ({ row, index }) => {
  emit("edit-data", { data: row, index });
};

const handleDeleteData = (index) => {
  // 找到对应的PDF文件和数据项
  let currentIndex = 0;
  for (const pdf of props.pdfFiles) {
    if (pdf.extractedData) {
      for (let i = 0; i < pdf.extractedData.length; i++) {
        if (currentIndex === index) {
          pdf.extractedData.splice(i, 1);
          ElMessage.success("数据已删除");
          return;
        }
        currentIndex++;
      }
    }
  }
};
</script>

<style scoped>
.upload-zone {
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  padding: 48px 24px;
  text-align: center;
  background: #fafafa;
  transition: all 0.3s ease;
}

.upload-zone.dragover {
  border-color: #3b82f6;
  background: #eff6ff;
}

.pdf-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  transition: all 0.2s ease;
}

.pdf-card:hover {
  border-color: #d1d5db;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}
</style>
