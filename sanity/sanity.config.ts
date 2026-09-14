import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {productionSchemaTypes, leadsSchemaTypes} from './schemaTypes'
import {exportLeadsTool} from './tools/exportLeadsTool'

export default defineConfig([
  {
    name: 'default',
    title: 'pais-gourmet-eventos',
    basePath: '/production',
    projectId: 'xo45blck',
    dataset: 'production',
    plugins: [structureTool(), visionTool()],
    schema: {
      types: productionSchemaTypes,
    },
  },
  {
    name: 'leads',
    title: 'Leads (privado)',
    basePath: '/leads',
    projectId: 'xo45blck',
    dataset: 'leads',
    plugins: [structureTool(), visionTool()],
    schema: {
      types: leadsSchemaTypes,
    },
    tools: [exportLeadsTool],
  },
])
