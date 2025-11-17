import { Navigate, useLocation } from 'react-router-dom'
import {getCurrentUser} from '../services/auth';

function isAuthenticated() {
    try {
        const raw = localStorage.getItem('auth-user')
        if(!raw) return false
        const parsed = JSON.parse(raw)
        return Boolean(parsed && parsed.email)
    }catch (_) {
        return false
    }
}

export default function ProtectedRoute() {
    const location = useLocation()
    if (!isAuthenticated()) {
        return <Navigate to="/login" replace state={{ from: location}} />
    }
    if (roles && roles.length) {
        const user = getCurrentUser()
        if(!user || !roles.includes(user.role)) {
            return <Navigate to={location.state?.from?.pathname || '/'} replace/>
        }
    }
    return children
}