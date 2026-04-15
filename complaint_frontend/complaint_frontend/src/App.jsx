import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Submit from './pages/Submit'
import Queue from './pages/Queue'
import ComplaintDetail from './pages/ComplaintDetail'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/"          element={<Dashboard />} />
        <Route path="/submit"    element={<Submit />} />
        <Route path="/queue"     element={<Queue />} />
        <Route path="/complaints/:id" element={<ComplaintDetail />} />
      </Routes>
    </Layout>
  )
}
