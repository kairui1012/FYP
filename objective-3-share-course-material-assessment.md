请在当前 Laravel + Inertia + React + TypeScript 项目中，为 Share Course Material / Study Material 模块新增两个功能，并保持现有多语言、学习流程和 UI 风格一致。

目标：
1. 给每份 material 增加学习状态：已读 / 未读 / 进行中 / 已完成。
2. 把 material -> quiz -> feedback 串成一条清晰的学习路径。
3. 给老师提供一个专门的页面或面板，查看：
   - 哪些资料评分低
   - 哪些题错得多
   - 哪些反馈重复出现

功能要求：

A. Material 学习状态
- 每份 material 需要显示一个状态标签：
  - 未读
  - 进行中
  - 已读
  - 已完成
- 状态必须能根据用户行为更新，而不是静态写死。
- 推荐规则（如果有quiz）：
  - 进入 material 页面但未开始 quiz：未读 / 进行中
  - 阅读过 material 但未做 quiz：进行中
  - 已完成 quiz：已完成
  - 如果资料已看过且已完成 quiz，可显示已读或已完成，具体逻辑保持一致并清晰定义
- 状态要与当前用户绑定，不能影响其他用户。
- 如果后端已有相似字段，优先复用；如果没有，请新增必要字段或接口。

C. Teacher 专用分析页（加进去side bar【rules】的下方）
- 设计一个 teacher/admin 专属页面或 section，用来查看学习数据。
- 至少展示三类分析：
  1. 哪些资料评分低
  2. 哪些 quiz 题错得多
  3. 哪些 feedback 内容重复出现
- 页面要支持按 material、subject、quiz、时间筛选，最好可排序。
- 需要能帮助老师快速定位要改进的内容。
- 重复反馈可以先用关键词聚类、标签统计或简单文本归类实现，不要求很重的 AI，但要有可用的聚合结果。

D. UI / UX 要求
- 保持现有项目风格，不要破坏现有页面结构。
- 多语言文案必须支持 en / zh / my。
- 组件化实现，避免在页面里堆太多 JSX。
- 页面布局要适合真实学习场景，重点突出：
  - 学习状态
  - 学习路径
  - 教师改进依据
- 如果需要新增组件，请拆成清晰的子组件。

E. 数据与实现建议
- 优先复用现有 post / quiz / feedback / analytics 数据结构。
- 如果需要新增字段，请尽量最小化改动。
- 需要考虑当前用户、课程资料、测验、反馈之间的关联关系。
- 若前端需要新接口，请同时补充后端路由、控制器、数据返回格式，确保页面可用。
- 如果可以，顺手补充必要的 types、translations 和测试。

交付标准：
- 功能能跑通
- 页面上能看到 material 状态、学习路径、teacher analytics
- 代码结构清晰，组件化
- 多语言正常
- 不影响现有学习资料、测验、反馈功能
- 最后请说明哪些部分是前端实现，哪些部分需要后端配合

请直接开始实现，并优先从现有 Share Course Material 页面和相关组件入手。


---
Effectiveness Status: Needs Improvement

Reason:
- Average rating is low: 1.0 / 5
- Quiz score is moderate: 75%
- No improvement detected across attempts
- Student feedback indicates unclear material

Recommended Action:
- Improve explanation clarity
- Add more examples
- Review quiz difficulty