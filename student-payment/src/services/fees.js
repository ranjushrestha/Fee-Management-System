import { apiClient } from "./api";

export async function listClasses() {
    const {data} = await apiClient.get('/classes');
    return data;
}

export async function listFeeStructure() {
    const {data} = await apiClient.get('/feeStructures');
    return data;
}

export async function upsertFeeStructure(params) {
    const {data: existing} = await apiClient.get('/feeStructures', {params: { className}} )
    if (existing.length) {
        const fs = existing[0]
        const { data } = await apiClient.patch(`/feeStructures/${fs.id}`, {amount});
        return data;
    }
    const  { data } = await apiClient.post('/feeStructures', {className, amount})
    return data;
}

export async function getStudentFee(studentId, className, rollNumber) {
    const [{data: overrides}, {data: structures}, extrasByRoll] = await Promise.all([
        apiClient.get('/studentFeeOverrides', { params : {studentId}}),
        apiClient.get('/feeStructures', {params : {className}} ),
        apiClient.get('/studentExtraCharges', {params : rollNumber ? {rollNumber} : {studentId}}),
    ]);
    const base = overrides.length ? Number(overrides[0].amount) : (structures.length ? Number(structures[0].amount) : 0);
    const extraSum = Array.isArray(extrasByRoll) ? extrasByRoll.reduce((s, x) => s + Number(x.amount || 0), 0) : 0;
    return Number(base) + Number(extraSum)
}

export async function setStudentOverride(studentId, amount) {
    const { data: existing} = await apiClient.get('/studentFeeOverrides', { params : {studentId}});
    if (existing.length) {
        const item = existing[0]
        const {data} = await apiClient.patch(`/studentFeeOverrides/ ${item.id}`, {amount})
        return data
    }
    const {data} = await apiClient.post('/studentFeeOverrides', {studentId, amount})
    return data
}

// Extra charges
export async function listExtraCharges(studentId) {
    const {data} = await apiClient.get('/studentExtraCharges', {params : {studentId}})
    return data
}

export async function addExtraCharge(payload) {
  const  {data} = await apiClient.post('/studentExtraCharges', payload  )
  return data
}