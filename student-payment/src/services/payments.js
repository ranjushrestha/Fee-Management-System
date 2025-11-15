import { apiClient } from "./api";

export async function listPayments() {
    const {data} = await apiClient.get('/payments?_expand=student')
    return data
}

export async function  createPayment(params) {
    const {data} = await apiClient.post('/payments ', payment)
    return data
}

export async function deletePayment(id) {
    await apiClient.delete(`/payments ${id}`)
}

















