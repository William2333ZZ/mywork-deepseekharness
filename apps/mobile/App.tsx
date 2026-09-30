/**
 * MyWork mobile — a native client for the MyWork running on your own computer.
 *
 * Screens (design/v2/MOBILE.md §2): pair · conversation (home) · 等你看 · new task · task page ·
 * MyWork page · task list · routine page · settings. One stack, one screen at a time.
 */
import React from 'react'
import { ActivityIndicator, StatusBar, View } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { Providers, useConn, useNav } from './src/store'
import { color } from './src/theme'
import Pair from './src/screens/Pair'
import Home from './src/screens/Home'
import NewTask from './src/screens/NewTask'
import TaskPage from './src/screens/TaskPage'
import MyWork from './src/screens/MyWork'
import Tasks from './src/screens/Tasks'
import RoutinePage from './src/screens/RoutinePage'
import Settings from './src/screens/Settings'

function Router() {
  const { conn, ready, failed } = useConn()
  const { route } = useNav()
  if (!ready) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: color.bg }}><ActivityIndicator color={color.fg2} /></View>
  if (!conn || failed) return <Pair />
  switch (route.name) {
    case 'new': return <NewTask prefill={route.prefill} />
    case 'task': return <TaskPage id={route.id} />
    case 'mywork': return <MyWork />
    case 'tasks': return <Tasks filter={route.filter} />
    case 'routine': return <RoutinePage id={route.id} />
    case 'settings': return <Settings />
    default: return <Home />
  }
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor={color.bg} />
      <Providers><Router /></Providers>
    </SafeAreaProvider>
  )
}
