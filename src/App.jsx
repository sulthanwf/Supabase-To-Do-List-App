import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function App() {
  const [session, setSession] = useState(null)
  const [todos, setTodos] = useState([])
  const [newTask, setNewTask] = useState('')

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchTodos()
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) fetchTodos()
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchTodos() {
    // ⚠️ This will fail initially because we haven't set RLS yet!
    let { data, error } = await supabase
      .from('todos')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setTodos(data)
  }

  async function addTodo() {
    const { error } = await supabase
      .from('todos')
      .insert({ title: newTask, user_id: session.user.id }) // Key step: attach user_id
    
    if (!error) {
      setNewTask('')
      fetchTodos()
    }
  }

  async function login() {
    await supabase.auth.signInWithOAuth({ provider: 'github' })
  }

  async function logout() {
    await supabase.auth.signOut()
    setTodos([])
  }

  if (!session) return (
    <div style={{ padding: '50px' }}>
      <h1>My To-Do List</h1>
      <button onClick={login}>Login with GitHub</button>
    </div>
  )

  return (
    <div style={{ padding: '50px' }}>
      <h1>My To-Do List</h1>
      <button onClick={logout}>Logout</button>
      <div style={{ marginTop: '20px' }}>
        <input 
          style={{ marginRight: '20px' }}
          value={newTask} 
          onChange={(e) => setNewTask(e.target.value)} 
          placeholder="New task..."
        />
        <button onClick={addTodo}>Add</button>
      </div>
      <ul>
        {todos.map(todo => (
          <li key={todo.id}>{todo.title}</li>
        ))}
      </ul>
    </div>
  )
}