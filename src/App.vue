<template>
  <div class="app-container">
    <div class="main-card max-w-7xl mx-auto">
      <!-- Header -->
      <div class="header flex justify-between items-center">
        <div>
          <h1>🔄 AI智能PDF数据提取工具</h1>
          <p class="text-sm opacity-80 mt-1">
            AI ParseIt v2.0 - 通用PDF数据提取平台
          </p>
        </div>
        <div class="flex gap-3">
          <el-button
            type="primary"
            plain
            @click="clearAllData"
            class="action-btn"
          >
            <el-icon><Delete /></el-icon> 清除所有数据
          </el-button>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="nav-tabs">
        <div
          v-for="(tab, index) in tabs"
          :key="index"
          :class="['nav-tab', { active: activeTab === index }]"
          @click="activeTab = index"
        >
          <el-icon><component :is="tab.icon" /></el-icon>
          {{ tab.name }}
        </div>
      </div>

      <!-- Content Area -->
      <div class="content-area">
        <transition name="fade" mode="out-in">
          <PDFUpload
            v-if="activeTab === 0"
            :pdf-files="pdfFiles"
            :ai-config="aiConfig"
            :field-config="fieldConfig"
            :global-extraction-rules="globalExtractionRules"
            @extract-pdf="handleExtractPdf"
            @extract-all="handleExtractAll"
            @remove-pdf="handleRemovePdf"
            @clear-all="handleClearAllPdfs"
            @preview-pdf="handlePreviewPdf"
            @edit-data="handleEditData"
            @switch-to-ai-config="activeTab = 1"
            @switch-to-field-config="activeTab = 2"
          />
          <AIConfig
            v-else-if="activeTab === 1"
            :ai-config="aiConfig"
            :field-config="fieldConfig"
            @save-config="handleSaveAiConfig"
            @test-connection="handleTestAiConnection"
            @reset-config="handleResetAiConfig"
          />
          <div v-else-if="activeTab === 2">
            <h2 class="section-title">字段配置</h2>
            <div class="config-card">
              <FieldConfigManager
                v-model="fieldConfig"
                v-model:globalExtractionRules="globalExtractionRules"
              />
            </div>
          </div>
          <Export
            v-else-if="activeTab === 3"
            :pdf-files="pdfFiles"
            :all-extracted-data="allExtractedData"
            :field-config="fieldConfig"
            @export="handleExport"
          />
        </transition>
      </div>
    </div>

    <!-- PDF Preview Dialog -->
    <PDFPreviewDialog
      v-model:visible="pdfPreviewVisible"
      :pdf-file="currentPreviewPdf"
    />

    <!-- Dynamic Edit Dialog -->
    <DynamicEditDialog
      v-model:visible="editDataVisible"
      :data="editDataItem"
      :fields="fieldConfig"
      :title="editDialogTitle"
      @save="handleSaveDataEdit"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Delete } from "@element-plus/icons-vue";
import PDFUpload from "./components/PDFUpload.vue";
import AIConfig from "./components/AIConfig.vue";
import Export from "./components/Export.vue";
import PDFPreviewDialog from "./components/PDFPreviewDialog.vue";
import DynamicEditDialog from "./components/DynamicEditDialog.vue";
import FieldConfigManager from "./components/FieldConfigManager.vue";

// Navigation
const tabs = [
  { name: "PDF上传", icon: "FolderOpened" },
  { name: "AI配置", icon: "Setting" },
  { name: "字段配置", icon: "Tools" },
  { name: "导出", icon: "Download" },
];
const activeTab = ref(0);

// State
const pdfFiles = ref([]);
const pdfPreviewVisible = ref(false);
const currentPreviewPdf = ref(null);
const editDataVisible = ref(false);
const editDataItem = ref(null);
const editDialogTitle = ref("编辑数据");

// Field Config
const fieldConfig = ref([]);
const globalExtractionRules = ref("");

// AI Config
const aiConfig = reactive({
  apiUrl: "",
  apiKey: "",
  apiModel: "",
  prompt: "",
  timeout: 60,
  retryCount: 3,
});

// Computed
const allExtractedData = computed(() => {
  const data = [];
  pdfFiles.value.forEach((pdf) => {
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

// Methods
const handleExtractPdf = (pdf) => {
  // This will be implemented in PDFUpload component
};

const handleExtractAll = () => {
  // This will be implemented in PDFUpload component
};

const handleRemovePdf = (index) => {
  pdfFiles.value.splice(index, 1);
  saveToLocalStorage();
};

const handleClearAllPdfs = () => {
  pdfFiles.value = [];
  saveToLocalStorage();
  ElMessage.success("已清除所有PDF文件");
};

const handlePreviewPdf = (pdf) => {
  currentPreviewPdf.value = pdf;
  pdfPreviewVisible.value = true;
};

const handleEditData = ({ data, index }) => {
  editDataItem.value = { ...data, _index: index };
  editDialogTitle.value = "编辑数据";
  editDataVisible.value = true;
};

const handleSaveDataEdit = (updatedData) => {
  // Update the data in pdfFiles
  const index = updatedData._index;
  let currentIndex = 0;

  for (const pdf of pdfFiles.value) {
    if (pdf.extractedData) {
      for (let i = 0; i < pdf.extractedData.length; i++) {
        if (currentIndex === index) {
          pdf.extractedData[i] = { ...updatedData };
          delete pdf.extractedData[i]._index;
          saveToLocalStorage();
          ElMessage.success("数据已更新");
          return;
        }
        currentIndex++;
      }
    }
  }
};

const handleSaveAiConfig = () => {
  localStorage.setItem(
    "aiConfig",
    JSON.stringify({
      apiUrl: aiConfig.apiUrl,
      apiKey: btoa(aiConfig.apiKey),
      apiModel: aiConfig.apiModel,
      prompt: aiConfig.prompt,
      timeout: aiConfig.timeout,
      retryCount: aiConfig.retryCount,
    })
  );
  ElMessage.success("配置已保存");
};

const handleTestAiConnection = async () => {
  // This will be handled in AIConfig component
};

const handleResetAiConfig = () => {
  aiConfig.apiUrl = "";
  aiConfig.apiKey = "";
  aiConfig.apiModel = "";
  aiConfig.prompt = "";
  aiConfig.timeout = 60;
  aiConfig.retryCount = 3;
};

const handleExport = () => {
  // This will be handled in Export component
};

const clearAllData = () => {
  ElMessageBox.confirm("确定要清除所有数据吗？此操作不可恢复。", "警告", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(() => {
      pdfFiles.value = [];
      fieldConfig.value = [];
      globalExtractionRules.value = "";
      localStorage.removeItem("pdfParseData");
      localStorage.removeItem("fieldConfig");
      ElMessage.success("所有数据已清除");
    })
    .catch(() => {});
};

// Local Storage
const saveToLocalStorage = () => {
  try {
    const data = {
      pdfFiles: pdfFiles.value.map((pdf) => ({
        ...pdf,
        data: pdf.data,
      })),
    };
    localStorage.setItem("pdfParseData", JSON.stringify(data));
  } catch (e) {
    console.error("保存数据失败:", e);
    if (e.name === "QuotaExceededError") {
      const lightData = {
        pdfFiles: pdfFiles.value.map((pdf) => ({
          name: pdf.name,
          size: pdf.size,
          type: pdf.type,
          uploadTime: pdf.uploadTime,
          extracted: pdf.extracted,
          extractedData: pdf.extractedData,
        })),
      };
      localStorage.setItem("pdfParseData", JSON.stringify(lightData));
      ElMessage.warning("存储空间不足，PDF文件数据未保存");
    }
  }
};

const saveFieldConfig = () => {
  try {
    const configData = {
      fields: fieldConfig.value,
      globalExtractionRules: globalExtractionRules.value,
    };
    localStorage.setItem("fieldConfig", JSON.stringify(configData));
  } catch (e) {
    console.error("保存字段配置失败:", e);
  }
};

const loadFromLocalStorage = () => {
  try {
    const saved = localStorage.getItem("pdfParseData");
    if (saved) {
      const data = JSON.parse(saved);
      pdfFiles.value = data.pdfFiles || [];
    }
  } catch (e) {
    console.error("加载数据失败:", e);
  }
};

const loadFieldConfig = () => {
  try {
    const saved = localStorage.getItem("fieldConfig");
    if (saved) {
      const config = JSON.parse(saved);
      // 支持新旧数据格式
      if (config.fields && Array.isArray(config.fields)) {
        // 新格式：包含fields和globalExtractionRules
        fieldConfig.value = config.fields || [];
        globalExtractionRules.value = config.globalExtractionRules || "";
      } else if (Array.isArray(config)) {
        // 旧格式：直接是字段数组
        fieldConfig.value = config;
        globalExtractionRules.value = "";
      } else {
        loadDefaultFieldConfig();
      }
    } else {
      // 如果没有保存的配置，加载默认的合同模板
      loadDefaultFieldConfig();
    }
  } catch (e) {
    console.error("加载字段配置失败:", e);
    loadDefaultFieldConfig();
  }
};

const loadDefaultFieldConfig = () => {
  // 默认使用合同订单模板
  fieldConfig.value = [
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
  ];
};

const loadAiConfig = () => {
  const saved = localStorage.getItem("aiConfig");
  if (saved) {
    try {
      const config = JSON.parse(saved);
      aiConfig.apiUrl = config.apiUrl || "";
      aiConfig.apiKey = config.apiKey ? atob(config.apiKey) : "";
      aiConfig.apiModel = config.apiModel || "";
      aiConfig.prompt = config.prompt || "";
      aiConfig.timeout = config.timeout || 60;
      aiConfig.retryCount = config.retryCount || 3;
    } catch (e) {
      console.error("加载AI配置失败", e);
    }
  }
};

// 监听字段配置变化，自动保存
import { watch } from "vue";
watch(fieldConfig, saveFieldConfig, { deep: true });
watch(globalExtractionRules, saveFieldConfig);

// Lifecycle
onMounted(() => {
  loadFromLocalStorage();
  loadFieldConfig();
  loadAiConfig();
});
</script>
