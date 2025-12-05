# 智能对账工具 - Auto Reconciliation

一个基于Vue3和AI技术的智能对账工具，支持PDF合同上传、自动提取产品信息、Excel数据导入和智能匹配对账。

## 📋 功能特性

### 📄 合同管理
- 支持PDF合同文件批量上传
- 合同文件预览功能
- 提取结果可视化展示

### 🤖 AI智能提取
- 集成大模型API，自动从合同中提取产品信息
- 支持自定义AI提示词和参数配置
- 批量提取功能，提高工作效率

### 📊 Excel数据处理
- 支持Excel文件上传和解析
- 多工作表选择
- 智能数据列匹配

### ✅ 对账匹配
- 自动匹配合同与Excel数据
- 支持多维度匹配规则（订单号、产品名称、颜色、包装）
- 手动匹配调整功能
- 匹配结果可视化展示

### 📤 数据导出
- 匹配结果Excel导出
- 提取数据Excel导出

### 💾 数据持久化
- 本地存储所有数据，无需服务器
- 支持数据清除和重置

## 🛠️ 技术栈

- **前端框架**: Vue 3
- **UI组件库**: Element Plus
- **Excel处理**: SheetJS
- **PDF处理**: PDF.js
- **样式框架**: Tailwind CSS
- **图标库**: Element Plus Icons

## 🚀 快速开始

### 环境要求

无需特殊环境，现代浏览器即可运行：
- Chrome (推荐)
- Firefox
- Safari
- Edge

### 本地运行

1. 克隆项目
```bash
git clone <repository-url>
cd reconciliation-
```

2. 启动本地服务器
```bash
# 使用Python 3
python3 -m http.server 8000

# 或使用Node.js
npx http-server -p 8000
```

3. 访问应用
打开浏览器访问 `http://localhost:8000`

### 在线部署

项目已配置Vercel部署支持，可直接部署：

1. Fork本项目到您的GitHub账户
2. 访问 [Vercel](https://vercel.com/)
3. 导入您的GitHub仓库
4. 点击"Deploy"按钮

## 📖 使用指南

### 1. 上传合同文件

- 点击"合同上传"标签
- 拖放或点击上传PDF合同文件
- 上传完成后可在列表中查看

### 2. 配置AI连接

- 点击"AI配置"标签
- 填写API地址、密钥和模型名称
- 点击"测试连接"验证配置
- 保存配置

### 3. 提取合同数据

- 返回"合同上传"标签
- 点击"提取数据"按钮开始提取
- 或使用"批量提取"处理所有合同

### 4. 上传Excel数据

- 点击"对账匹配"标签
- 上传Excel对账文件
- 选择要使用的工作表
- 点击"解析数据"

### 5. 配置匹配规则

- 在"对账匹配"标签中
- 选择对应的匹配列（订单号、产品名称等）
- 点击"开始匹配"

### 6. 查看和调整结果

- 匹配完成后查看结果列表
- 绿色表示自动匹配成功
- 黄色表示需手动选择
- 红色表示未匹配到
- 点击"手动匹配"进行调整

### 7. 导出结果

- 匹配完成后点击"导出结果"
- 或点击"导出提取数据"导出所有提取的产品信息

## ⚙️ AI配置说明

### 支持的模型

- OpenAI (gpt-4o, gpt-4, gpt-3.5-turbo)
- Anthropic (claude-3-sonnet, claude-3-opus)
- 阿里云通义千问 (qwen-max, qwen-plus)
- 百度文心一言
- 字节跳动豆包

### 配置参数

- **API地址**: 模型API的完整URL
- **API密钥**: 访问API的密钥
- **模型名称**: 使用的具体模型名称
- **提示词**: 自定义AI提取规则
- **请求超时**: API请求超时时间（秒）
- **重试次数**: 请求失败后的重试次数

## 📁 项目结构

```
├── index.html          # 主页面
├── package.json        # 项目配置
├── vercel.json         # Vercel部署配置
└── README.md           # 项目文档
```

## 🔧 开发说明

### 依赖管理

项目使用CDN引入所有依赖，无需安装：

- Vue 3
- Element Plus
- SheetJS
- PDF.js
- Tailwind CSS

### 自定义开发

1. 修改 `index.html` 中的Vue组件逻辑
2. 调整样式或添加新功能
3. 使用本地服务器测试

## 📄 许可证

本项目采用 [MIT](https://opensource.org/licenses/MIT) 许可证。

## 🤝 贡献

欢迎提交Issue和Pull Request来帮助改进项目！

### 贡献指南

1. Fork本项目
2. 创建您的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开一个Pull Request

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- GitHub Issues: [项目Issues页面](https://github.com/yourusername/reconciliation-/issues)

## 🙏 致谢

- [Vue.js](https://vuejs.org/) - 渐进式JavaScript框架
- [Element Plus](https://element-plus.org/) - 企业级UI组件库
- [SheetJS](https://sheetjs.com/) - Excel文件处理库
- [PDF.js](https://mozilla.github.io/pdf.js/) - PDF文档处理库
- [Tailwind CSS](https://tailwindcss.com/) - 实用优先的CSS框架

---

**Enjoy using Auto Reconciliation! 🎉**