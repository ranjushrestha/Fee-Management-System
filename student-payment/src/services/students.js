import { apiClient } from "./api";

export async function listStudents() {
    const {data} = await apiClient.get('/students')
    return data
}

export async function createStudent(student) {
    const {data} = await apiClient.post('/students', student)
    return data
}

export async function updateStudent(id, updates) {
    const {data} = await apiClient.patch(`/students/${id}`, updates)
    return data
}

export async function deleteStudent(id) {
    await apiClient.delete(`/students, ${id}`)
}