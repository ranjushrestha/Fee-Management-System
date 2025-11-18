import { useEffect, useMemo, useState } from "react";
import {listPayments, createPayment, deletePayment} from "../services/payments";
import { apiClient } from "../services/api";
import Receipts from "../components/Receipt";
import Modal from "../components/Modal";
import { useI18n } from "../i18n";

export default function Payments() {
    const {t} = useI18n();
    const [payments, setPayments] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm ] = useState({ rollNumber: '', amount: '', date: '', time: '', status: 'PAID', method: 'Cash', reference: ''});
    const [error, setError] = useState('');
    const [deleteTarget, setDeleteTarget] = useState(null);

    useEffect( () => {
        async function load() {
            setLoading(true);
            try {
                const [p, s] = await Promise.all([listPayments(), apiClient.get('/students')])
                setPayments(p)
                setStudents(s.data)
            } finally {
                setLoading(false)
            }
        }
        load();
    }, [])

    const rollToStudent = useMemo(() => Object.fromEntries(students.map(s => [String(s.rollNumber), s])), [students])
    const cashPayments = useMemo(() => payments.filter(p => (p.method || '').toLowerCase() === 'cash'), [payments])
    const onlinePayments = useMemo(() => payments.filter(p => (p.method || '').toLowerCase() !== 'cash'), [payments])

    async function handleCreate(e) {
        e.PreventDefault()
        setError('')
        try {
            const payload = {...form, amount: Number(form.amount)}
            const stu = rollToStudent[String(form.rollNumber)]
            if (!stu || !payload.amount || !payload.date) {
                setError('Roll no, amount, and date are required')
                return
            }
            const record = {
                studentRoll: String(stu.rollNumber),
                studentName: stu.name,
                studentClass: stu.class,
                amount: Number(payload),
                date: payload.date,
                time: payload.time || new Date().toTimeString().slice(0,5),
                status: payload.status,
                method: payload.method,
                reference: payload.reference,
            }
            const created = await createPayment(record)
            setPayments(prev => [...prev, created])
            setForm({ rollNumber:'', amount:'', date:'', time:'', status:'PAID', method:'Cash', reference:'' })
        } catch(err) {
            setError(err.message || 'Failed to create payment')
        }
    }

    async function confirmDelete(params) {
        if (!deleteTarget) return;
        await deletePayment(deleteTarget.id)
        setPayments(prev => prev.filter(p => p.id !== deleteTarget.id))
        setDeleteTarget(null);
    }

    return (
  <div className="container">
      <h2>Payments</h2>
      <section style={{ marginTop: 16 }}>
        <div className="section-title">{t('doPayment')}</div>
        <form onSubmit={handleCreate} className="surface card" style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(8, 1fr)' }}>
          <input placeholder={t('rollNo') || 'Roll No.'} value={form.rollNumber} onChange={(e) => setForm({ ...form, rollNumber: e.target.value })} />
          <input placeholder={t('name') || 'Name'} value={rollToStudent[form.rollNumber]?.name || ''} readOnly />
          <input placeholder={t('class') || 'Class'} value={rollToStudent[form.rollNumber]?.class || ''} readOnly />
          <input type="number" placeholder={t('amount') || 'Amount'} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
          <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
            <option>{t('cash') || 'Cash'}</option>
            <option>{t('online') || 'Online'}</option>
            <option>{t('card') || 'Card'}</option>
            <option>UPI</option>
            <option>{t('bank') || 'Bank'}</option>
          </select>
          <input placeholder={t('reference') || 'Reference'} value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
          <button className="btn primary" type="submit">{t('add')}</button>
        </form>
        {error && <div style={{ color: 'var(--danger)', marginTop: 8 }}>{error}</div>}
      </section>

      <section style={{ marginTop: 24 }}>
        <div className="section-title">{t('cashPayments')}</div>
        {loading ? (
          <div>{t('loading')}</div>
        ) : (
          <table className="table surface">
            <thead>
              <tr>
                <th>ID</th>
                <th>{t('student') || 'Student'}</th>
                <th>{t('class') || 'Class'}</th>
                <th>{t('rollNo') || 'Roll'}</th>
                <th>{t('amount') || 'Amount'}</th>
                <th>{t('date') || 'Date'}</th>
                <th>{t('time') || 'Time'}</th>
                <th>{t('method') || 'Method'}</th>
                <th>{t('reference') || 'Reference'}</th>
                <th>{t('actions') || 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {cashPayments.map(p => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.studentName || '—'}</td>
                  <td>{p.studentClass || '—'}</td>
                  <td>{p.studentRoll || '—'}</td>
                  <td>₹{p.amount}</td>
                  <td>{p.date}</td>
                  <td>{p.time || '—'}</td>
                  <td>{p.method}</td>
                  <td>{p.reference}</td>
                  <td style={{ display: 'flex', gap: 8 }}>
                    <Receipt payment={p} student={rollToStudent[p.studentRoll]} />
                    <button className="btn danger" onClick={() => setDeleteTarget(p)}>{t('delete')}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section style={{ marginTop: 24 }}>
        <div className="section-title">{t('onlinePayments')}</div>
        {loading ? (
          <div>{t('loading')}</div>
        ) : (
          <table className="table surface">
            <thead>
              <tr>
                <th>ID</th>
                <th>{t('student') || 'Student'}</th>
                <th>{t('class') || 'Class'}</th>
                <th>{t('rollNo') || 'Roll'}</th>
                <th>{t('amount') || 'Amount'}</th>
                <th>{t('date') || 'Date'}</th>
                <th>{t('time') || 'Time'}</th>
                <th>{t('method') || 'Method'}</th>
                <th>{t('reference') || 'Reference'}</th>
                <th>{t('actions') || 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {onlinePayments.map(p => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.studentName || '—'}</td>
                  <td>{p.studentClass || '—'}</td>
                  <td>{p.studentRoll || '—'}</td>
                  <td>₹{p.amount}</td>
                  <td>{p.date}</td>
                  <td>{p.time || '—'}</td>
                  <td>{p.method}</td>
                  <td>{p.reference}</td>
                  <td style={{ display: 'flex', gap: 8 }}>
                    <Receipt payment={p} student={rollToStudent[p.studentRoll]} />
                    <button className="btn danger" onClick={() => setDeleteTarget(p)}>{t('delete')}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
      <DeletePaymentModal open={Boolean(deleteTarget)} payment={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete} />
    </div>
  )
}
function DeletePaymentModal({ open, payment, onClose, onConfirm }) {
  return (
    <Modal open={open} title="Delete Payment" onClose={onClose} footer={
      <>
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn danger" onClick={onConfirm}>Delete</button>
      </>
    }>
      <div>Delete payment <strong>{payment?.id}</strong> of ₹{payment?.amount}?</div>
    </Modal>
  )
}



