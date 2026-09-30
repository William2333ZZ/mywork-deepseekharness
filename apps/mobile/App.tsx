/**
 * MyWork mobile — a native client for the MyWork running on your own computer.
 *
 * Screens (design/v2/TEAMMATES.md §8.5, MOBILE.md §10): pair · home (the column) · thread (今日 / task / routine / new) ·
 * 交付物 · settings. One stack, one screen at a time; the app starts on the column and a thread is pushed on top of it.
 */
import React from 'react'
import { ActivityIndicator, StatusBar, View } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { Providers, useConn, useNav } from './src/store'
import { color } from './src/theme'
import Pair from './src/screens/Pair'
import Home from './src/screens/Home'
import Thread from './src/screens/Thread'
import Deliverables from './src/screens/Deliverables'
import Settings from './src/screens/Settings'

function Router() {
  const { conn, ready, failed } = useConn()
  const { route } = useNav()
  if (!ready) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: color.bg }}><ActivityIndicator color={color.fg2} /></View>
  if (!conn || failed) return <Pair />
  switch (route.name) {
    case 'thread': return <Thread kind={route.kind} id={route.id} />
    case 'deliverables': return <Deliverables />
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
