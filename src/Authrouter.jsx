import { useState } from 'react'
import Login  from './Login'
import Signup from './Signup'
 
export default function AuthRouter() {
  const [page, setPage] = useState('login')
  return page === 'login'
    ? <Login  onGoSignup={() => setPage('signup')} />
    : <Signup onGoLogin={()  => setPage('login')}  />
}
 