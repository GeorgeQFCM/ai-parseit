<template>
  <div>
    <el-table
      :data="tableData"
      border
      stripe
      max-height="400"
      style="width: 100%"
      v-loading="loading"
    >
      <!-- 文档名称列 -->
      <el-table-column
        prop="documentName"
        label="文档名称"
        min-width="150"
        max-width="300"
        show-overflow-tooltip
      />

      <!-- 动态字段列 -->
      <el-table-column
        v-for="field in fields"
        :key="field.id"
        :prop="field.id"
        :label="field.title || field.name"
        :width="getColumnWidth(field)"
        :show-overflow-tooltip="field.type === 'text'"
      >
        <template #default="scope">
          <div v-if="field.type === 'number' && scope.row[field.id] !== null">
            <span class="text-green-600 font-semibold">
              {{ formatNumber(scope.row[field.id], field) }}
            </span>
          </div>
          <div v-else-if="field.type === 'date' && scope.row[field.id]">
            {{ formatDate(scope.row[field.id]) }}
          </div>
          <div v-else-if="field.type === 'boolean'">
            <el-tag :type="scope.row[field.id] ? 'success' : 'info'">
              {{ scope.row[field.id] ? "是" : "否" }}
            </el-tag>
          </div>
          <div v-else-if="field.type === 'select' && scope.row[field.id]">
            <el-tag>{{ scope.row[field.id] }}</el-tag>
          </div>
          <div v-else>
            {{ scope.row[field.id] || "-" }}
          </div>
        </template>
      </el-table-column>

      <!-- 操作列 -->
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="scope">
          <el-button
            type="primary"
            size="small"
            link
            @click="editRow(scope.row, scope.$index)"
          >
            编辑
          </el-button>
          <el-button
            type="danger"
            size="small"
            link
            @click="deleteRow(scope.$index)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div
      v-if="showPagination && totalCount > pageSize"
      class="mt-4 flex justify-center"
    >
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="totalCount"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 统计信息 -->
    <div v-if="showStats" class="mt-4 p-4 bg-gray-50 rounded-lg">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="text-center">
          <div class="text-2xl font-bold text-blue-600">{{ totalCount }}</div>
          <div class="text-sm text-gray-600">总记录数</div>
        </div>
        <div v-for="stat in numberStats" :key="stat.field" class="text-center">
          <div class="text-2xl font-bold text-green-600">
            {{ formatNumber(stat.value, stat.fieldConfig) }}
          </div>
          <div class="text-sm text-gray-600">{{ stat.label }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";

const props = defineProps({
  data: {
    type: Array,
    default: () => [],
  },
  fields: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  showPagination: {
    type: Boolean,
    default: true,
  },
  showStats: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(["edit", "delete", "page-change"]);

const currentPage = ref(1);
const pageSize = ref(20);

// 计算属性
const totalCount = computed(() => props.data.length);

const tableData = computed(() => {
  if (!props.showPagination) {
    return props.data;
  }
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return props.data.slice(start, end);
});

// 数字字段统计
const numberStats = computed(() => {
  const stats = [];
  const numberFields = props.fields.filter((field) => field.type === "number");

  numberFields.forEach((field) => {
    const values = props.data
      .map((row) => row[field.id])
      .filter((val) => val !== null && val !== undefined && !isNaN(val));

    if (values.length > 0) {
      const sum = values.reduce((acc, val) => acc + Number(val), 0);
      stats.push({
        field: field.id,
        fieldConfig: field,
        label: `${field.title || field.name}总计`,
        value: sum,
      });
    }
  });

  return stats.slice(0, 3); // 最多显示3个统计
});

// 方法
const getColumnWidth = (field) => {
  switch (field.type) {
    case "number":
      return 120;
    case "date":
      return 120;
    case "boolean":
      return 80;
    case "select":
      return 100;
    default:
      const displayName = field.title || field.name;
      return displayName.length > 6 ? 150 : 120;
  }
};

const formatNumber = (value, field) => {
  if (value === null || value === undefined) return "-";

  const num = Number(value);
  if (isNaN(num)) return value;

  const precision = field.precision || 0;
  const formatted = num.toFixed(precision);
  const unit = field.unit || "";

  return unit ? `${formatted}${unit}` : formatted;
};

const formatDate = (value) => {
  if (!value) return "-";

  try {
    const date = new Date(value);
    return date.toLocaleDateString("zh-CN");
  } catch (e) {
    return value;
  }
};

const editRow = (row, index) => {
  emit("edit", { row, index });
};

const deleteRow = (index) => {
  ElMessageBox.confirm("确定要删除这条记录吗？", "确认删除", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(() => {
      emit("delete", index);
      ElMessage.success("删除成功");
    })
    .catch(() => {});
};

const handleSizeChange = (newSize) => {
  pageSize.value = newSize;
  currentPage.value = 1;
  emit("page-change", { page: currentPage.value, size: pageSize.value });
};

const handleCurrentChange = (newPage) => {
  currentPage.value = newPage;
  emit("page-change", { page: currentPage.value, size: pageSize.value });
};

// 监听数据变化，重置分页
watch(
  () => props.data.length,
  () => {
    if (currentPage.value > 1 && tableData.value.length === 0) {
      currentPage.value = 1;
    }
  }
);
</script>

<style scoped>
:deep(.el-table .el-table__cell) {
  padding: 8px 0;
}

:deep(.el-table--border .el-table__cell) {
  border-right: 1px solid #ebeef5;
}
</style>
