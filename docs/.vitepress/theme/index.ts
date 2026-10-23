import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'

import HomePage from './components/HomePage.vue'
import Mermaid from './components/Mermaid.vue'
import ProgressCenter from './components/ProgressCenter.vue'
import ProjectDetail from './components/ProjectDetail.vue'
import ProjectList from './components/ProjectList.vue'
import QuizPanel from './components/QuizPanel.vue'
import Layout from './Layout.vue'
import './styles/custom.css'

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.component('HomePage', HomePage)
    app.component('Mermaid', Mermaid)
    app.component('ProgressCenter', ProgressCenter)
    app.component('ProjectDetail', ProjectDetail)
    app.component('ProjectList', ProjectList)
    app.component('QuizPanel', QuizPanel)
  }
} satisfies Theme
