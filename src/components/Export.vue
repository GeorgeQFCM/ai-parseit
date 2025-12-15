<template>
  <div>
    <h2 class="section-title">导出结果</h2>

    <div class="config-card">
      <h3 class="font-semibold text-gray-700 mb-4">📊 导出选项</h3>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          class="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:border-green-500 hover:bg-green-50 transition-all"
          @click="exportData('excel')"
        >
          <el-icon :size="48" color="#22c55e"><FolderChecked /></el-icon>
          <p class="text-lg font-medium mt-3">导出Excel文件</p>
          <p class="text-sm text-gray-500 mt-1">包含所有字段的详细数据表格</p>
          <el-button
            type="success"
            class="mt-4"
            :disabled="allExtractedData.length === 0"
          >
            导出Excel
          </el-button>
        </div>

        <div
          class="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
          @click="exportData('csv')"
        >
          <el-icon :size="48" color="#3b82f6"><Document /></el-icon>
          <p class="text-lg font-medium mt-3">导出CSV文件</p>
          <p class="text-sm text-gray-500 mt-1">
            轻量级数据格式，便于导入其他系统
          </p>
          <el-button
            type="primary"
            class="mt-4"
            :disabled="allExtractedData.length === 0"
          >
            导出CSV
          </el-button>
        </div>
      </div>
    </div>

    <!-- Export Progress -->
    <div v-if="isExporting" class="config-card mt-4">
      <div class="flex justify-between mb-2">
        <span class="text-gray-600">导出进度</span>
        <span class="text-gray-800 font-medium">{{ exportProgress }}%</span>
      </div>
      <div class="progress-bar">
        <div
          class="progress-fill"
          :style="{ width: exportProgress + '%' }"
        ></div>
      </div>
    </div>

    <!-- Field Configuration Preview -->
    <div v-if="fieldConfig.length > 0" class="config-card mt-6">
      <h3 class="font-semibold text-gray-700 mb-4">📋 导出字段预览</h3>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        <div
          v-for="field in fieldConfig"
          :key="field.id"
          class="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
        >
          <el-icon :size="16" :color="getFieldTypeColor(field.type)">
            <component :is="getFieldTypeIcon(field.type)" />
          </el-icon>
          <span class="text-sm font-medium">{{ field.title || field.name }}</span>
          <el-tag v-if="field.required" size="small" type="danger">必填</el-tag>
        </div>
      </div>
    </div>

    <!-- Data Summary -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
      <div class="stats-card">
        <div class="flex items-center gap-3">
          <div
            class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center"
          >
            <el-icon :size="24" color="#3b82f6"><Folder /></el-icon>
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-800">
              {{ pdfFiles.length }}
            </p>
            <p class="text-sm text-gray-500">PDF文件</p>
          </div>
        </div>
      </div>
      <div class="stats-card">
        <div class="flex items-center gap-3">
          <div
            class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center"
          >
            <el-icon :size="24" color="#22c55e"><Goods /></el-icon>
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-800">
              {{ allExtractedData.length }}
            </p>
            <p class="text-sm text-gray-500">提取记录</p>
          </div>
        </div>
      </div>
      <div class="stats-card">
        <div class="flex items-center gap-3">
          <div
            class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center"
          >
            <el-icon :size="24" color="#8b5cf6"><Tools /></el-icon>
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-800">
              {{ fieldConfig.length }}
            </p>
            <p class="text-sm text-gray-500">配置字段</p>
          </div>
        </div>
      </div>
      <div class="stats-card">
        <div class="flex items-center gap-3">
          <div
            class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center"
          >
            <el-icon :size="24" color="#f97316"><DataAnalysis /></el-icon>
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-800">
              {{ extractedFilesCount }}
            </p>
            <p class="text-sm text-gray-500">已提取文件</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { ElMessage } from "element-plus";
import {
  FolderChecked,
  Folder,
  Goods,
  Document,
  Tools,
  DataAnalysis,
  Calendar,
  Switch,
  List,
  EditPen,
} from "@element-plus/icons-vue";
import * as XLSX from "xlsx";

const props = defineProps({
  pdfFiles: {
    type: Array,
    required: true,
  },
  allExtractedData: {
    type: Array,
    required: true,
  },
  fieldConfig: {
    type: Array,
    required: true,
  },
});

const isExporting = ref(false);
const exportProgress = ref(0);

// 计算属性
const extractedFilesCount = computed(() => {
  return props.pdfFiles.filter((pdf) => pdf.extracted).length;
});

// 获取字段类型图标
const getFieldTypeIcon = (type) => {
  const icons = {
    text: "EditPen",
    number: "DataAnalysis",
    date: "Calendar",
    boolean: "Switch",
    select: "List",
  };
  return icons[type] || "EditPen";
};

// 获取字段类型颜色
const getFieldTypeColor = (type) => {
  const colors = {
    text: "#6b7280",
    number: "#059669",
    date: "#dc2626",
    boolean: "#7c3aed",
    select: "#ea580c",
  };
  return colors[type] || "#6b7280";
};

const exportData = (format = "excel") => {
  if (props.allExtractedData.length === 0) {
    ElMessage.warning("没有可导出的数据");
    return;
  }

  isExporting.value = true;
  exportProgress.value = 0;

  // Simulate progress
  const interval = setInterval(() => {
    exportProgress.value += 10;
    if (exportProgress.value >= 100) {
      clearInterval(interval);
      performExport(format);
      setTimeout(() => {
        isExporting.value = false;
        exportProgress.value = 0;
      }, 500);
    }
  }, 50);
};

const performExport = (format) => {
  const timestamp = new Date().toLocaleDateString().replace(/\//g, "-");

  if (format === "excel") {
    exportToExcel(timestamp);
  } else if (format === "csv") {
    exportToCSV(timestamp);
  }
};

const exportToExcel = (timestamp) => {
  // 准备导出数据，确保字段顺序
  const exportData = props.allExtractedData.map((item) => {
    const orderedItem = {};

    // 首先添加文档信息
    orderedItem["文档名称"] = item.documentName;
    orderedItem["文档类型"] = item.documentType;

    // 然后按字段配置顺序添加字段
    props.fieldConfig.forEach((field) => {
      let value = item[field.id];
      const fieldName = field.title || field.name;

      // 格式化数据
      if (field.type === "number" && value !== null && value !== undefined) {
        value = Number(value);
        if (field.unit) {
          orderedItem[fieldName] = `${value}${field.unit}`;
        } else {
          orderedItem[fieldName] = value;
        }
      } else if (field.type === "boolean") {
        orderedItem[fieldName] = value ? "是" : "否";
      } else if (field.type === "date" && value) {
        orderedItem[fieldName] = value;
      } else {
        orderedItem[fieldName] = value || "";
      }
    });

    return orderedItem;
  });

  const ws = XLSX.utils.json_to_sheet(exportData);

  // 设置列宽
  const colWidths = [];
  colWidths.push({ wch: 20 }); // 文档名称
  colWidths.push({ wch: 12 }); // 文档类型

  props.fieldConfig.forEach((field) => {
    const fieldName = field.title || field.name;
    let width = Math.max(fieldName.length * 2, 10);
    if (field.type === "text" && fieldName.includes("备注")) {
      width = 30;
    }
    colWidths.push({ wch: width });
  });

  ws["!cols"] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "提取数据");

  XLSX.writeFile(wb, `PDF数据提取结果_${timestamp}.xlsx`);
  ElMessage.success("Excel文件导出成功");
};

const exportToCSV = (timestamp) => {
  // 准备CSV数据
  const headers = ["文档名称", "文档类型"];
  props.fieldConfig.forEach((field) => {
    headers.push(field.title || field.name);
  });

  const csvData = [headers];

  props.allExtractedData.forEach((item) => {
    const row = [item.documentName, item.documentType];

    props.fieldConfig.forEach((field) => {
      let value = item[field.id];

      if (field.type === "number" && value !== null && value !== undefined) {
        value = Number(value);
        if (field.unit) {
          value = `${value}${field.unit}`;
        }
      } else if (field.type === "boolean") {
        value = value ? "是" : "否";
      } else if (value === null || value === undefined) {
        value = "";
      }

      // CSV需要处理包含逗号和引号的字段
      if (
        typeof value === "string" &&
        (value.includes(",") || value.includes('"') || value.includes("\n"))
      ) {
        value = `"${value.replace(/"/g, '""')}"`;
      }

      row.push(value);
    });

    csvData.push(row);
  });

  // 转换为CSV字符串
  const csvContent = csvData.map((row) => row.join(",")).join("\n");

  // 添加BOM以支持中文
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  // 下载文件
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `PDF数据提取结果_${timestamp}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  ElMessage.success("CSV文件导出成功");
};
</script>
