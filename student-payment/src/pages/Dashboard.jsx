import { useEffect, useState } from "react";
import { Link, replace, useNavigate } from "react-router-dom";
import { getCurrentUser, logout } from "../services/auth";
import { apiClient } from "../services/api";
import { getStudentFee } from "../services/fees";
import Receipt from "../components/Receipt";
import Modal from "../components/Modal";
import { useI18n } from "../i18n";

export default function Dashboard() {
  const { t } = useI18n();
  const [stats, setStats] = useState({
    students: 0,
    payments: 0,
    paidAmount: 0,
  });
  const [reports, setReports] = useState(null);
  const user = getCurrentUser();
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      if (user?.role === "student") return;
      const [
        studentRes,
        paymentsRes,
        feeStrusturesRes,
        overridesRes,
        extrasRes,
      ] = await Promise.all([
        apiClient.get("/students"),
        apiClient.get("/payments"),
        apiClient.get("/feeStructures"),
        apiClient.get("/studentFeeOverrides"),
        apiClient.get("/studentExtraCharges"),
      ]);
      const paidAmount = paymentsRes.data.reduce(
        (sum, p) => sum + Number(p.amount || 0),
        0
      );
      setStats({
        students: studentRes.data.length,
        payments: paymentsRes.data.length,
        paidAmount,
      });
      setReports({
        students: studentRes.data,
        payments: paymentsRes.data,
        feeStrustures: feeStrusturesRes.data,
        overrides: overridesRes.data,
        extras: extrasRes.data,
      });
    }
    load();
  }, [user?.role]);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  if (user?.role === "student") {
    return <StudentDashboard user={user} onLogout={handleLogout} />;
  }

  return (
    <div className="container">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2>{t("dashboard")}</h2>
        <div>
          <span style={{ marginRight: 12, color: "var(--muted)" }}>
            {t("hello") || "Hello"}, {user?.name}
          </span>
          <button className="btn" onClick={handleLogout}>
            {t("logout")}
          </button>
        </div>
      </div>
      <div className="grid cols-3" style={{ marginTop: 16 }}>
        <Stat title={t("students")} value={stats.students} />
        <Stat title={t("payments")} value={stats.payments} />
        <Stat
          title={t("totalPaid") || "Total Paid"}
          value={`₹${stats.paidAmount}`}
        />
      </div>

      <AdminReportsEmbed reports={reports} />
    </div>
  );
}

function Stat({ title, value }) {
  return (
    <div className="surface stat">
      <div className="stat-title">{title}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}

function AdminReportsEmbed() {
  const { t } = useI18n();
  if (!reports) return null;
  const {
    students = [],
    payments = [],
    feeStructures = [],
    overrides = [],
    extras = [],
  } = reports;
  const feeFor = (student) => {
    const ov = overrides.find(
      (o) => Number(o.studentId) === Number(student.id)
    );
    if (ov) return Number(ov.amount);
    const fs = feeStructures.find((x) => x.className === student.class);
    const base = fs ? Number(fs.amount) : 0;
    const extraSum = extras
      .filter((e) => String(e.rollNumber) === String(student.rollNumber))
      .reduce((sum, x) => sum + Number(x.amount || 0), 0);
    return base + extraSum;
  };

  const byStudent = student.map((s) => {
    const paid = payments
      .filter(
        (p) =>
          String(p.StudentRoll || p.studentId) === String(s.rollNumber) ||
          Number(p.studentId) === Number(s.id)
      )
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const fee = feeFor(s);
    return { id: s.id, name: s.name, fee, paid, due: Math.max(0, fee - paid) };
  });
  const collected = byStudent.reduce((sum, x) => sum + x.paid, 0);
  const expected = byStudent.reduce((sum, x) => sum + x.fee, 0);
  const remaining = Math.max(0, expected - collected);
  return (
    <div style={{ marginTop: 24 }}>
      <div className="grid cols-3">
        <Stat
          title={t("totalExpected") || "Total Expected"}
          value={`₹${expected}`}
        />
        <Stat
          title={t("totalCollected") || "Total Collected"}
          value={`₹${collected}`}
        />
        <Stat
          title={t("totalRemaining") || "Total Remaining"}
          value={`₹${remaining}`}
        />
      </div>

      <div className="section-title" style={{ marginTop: 16 }}>
        {t("perStudent") || "Per Student"}
      </div>
      <table>
        <thead>
          <tr>
            <th>{t("id") || "ID"}</th>
            <th>{t("name") || "Name"}</th>
            <th>{t("totalFee") || "Fee"}</th>
            <th>{t("paid") || "Paid"}</th>
            <th>{t("pending") || "Due"}</th>
          </tr>
        </thead>
        <tbody>
          {byStudent.map((r) => (
            <tr key={r.id}>
              <td>{r.id}</td>
              <td>{r.name}</td>
              <td>₹{r.fee}</td>
              <td>₹{r.paid}</td>
              <td
                style={{
                  color: r.due > 0 ? "var(--danger)" : "var(--success)",
                }}
              >
                ₹{r.due}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: 16 }}>
        <Link className="btn primary" to="/payments">
          {t("goToPayments") || "Go to Paymnets"}
        </Link>
      </div>
    </div>
  );
}

function StudentDashboard({ user, onLogout }) {
  const { t } = useI18n();
  const [student, setStudent] = useState(null);
  const [payments, setPayments] = useState([]);
  const [fee, setFee] = useState(0);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [sucessOpen, setSuccessOpen] = useState(false);
  const [recent, setRecent] = useState(null);

  useEffect(() => {
    async function load(params) {
      setLoading(true);
      try {
        const { data: students } = await apiClient.get("/students");
        const linked =
          students.find((s) => String(s.id) === String(user.studentId)) ||
          student.find((s) => s.email === user.email);
        setStudent(linked || null);

        const { data: allPayments } = await apiClient.get("/payments");
        const myPayments = allPayments.filter(
          (p) =>
            String(p.StudentRoll) === String(linked?.rollNumber) ||
            Number(p.studentId) === Number(linked?.id)
        );
        setPayments(myPayments);

        if (linked) {
          const f = await apiClient.get(
            linked.id,
            linked.class,
            linked.rollNumber
          );
          setFee(Number(f) || 0);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user.studentId, user.email]);

  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const due = Math.max(0, Number(fee) - Number(totalPaid));

  async function payNow(params) {
    if (!student) return;
    const toPay = Number(payAmount || due);
    if (toPay <= 0 || toPay > due) setCreating(true);
    try {
      const payLoad = {
        StudentRoll: String(student.rollNumber),
        studentName: student.name,
        studentClass: student.class,
        amount: Number(toPay),
        date: new Date().toISOString().slice(0, 10),
        time: new Date().toTimeString().slice(0, 5),
        status: "PAID",
        method: "Online",
        reference: "OnlinePayment",
      };
      const { data: created } = await apiClient.post("/payments", payLoad);
      setPayments((prev) => [...prev, created]);
      setRecent(created);
      setSuccessOpen(true);
    } finally {
      setCreating(false);
    }
  }

   return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>{t('myDashboard') || t('dashboard')}</h2>
        <div>
          <span style={{ marginRight: 12, color: 'var(--muted)' }}>{(t('hello') || 'Hello')}, {user?.name}</span>
          <button className="btn" onClick={onLogout}>{t('logout')}</button>
        </div>
      </div>
      {loading ? (t('loading') || 'Loading...') : (
        <>
          <div className="surface card" style={{ marginTop: 12 }}>
            <div className="section-title">{t('studentDetails') || 'Student Details'}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              <div><strong>{t('name') || 'Name'}:</strong> {student?.name}</div>
              <div><strong>{t('id') || 'ID'}:</strong> {student?.id}</div>
              <div><strong>{t('class') || 'Class'}:</strong> {student?.class}</div>
              <div><strong>{t('email') || 'Email'}:</strong> {user?.email}</div>
            </div>
          </div>

          <div className="grid cols-3" style={{ marginTop: 16 }}>
            <div className="surface stat"><div className="stat-title">{t('totalFee') || 'Total Fee'}</div><div className="stat-value">₹{fee}</div></div>
            <div className="surface stat"><div className="stat-title">{t('paid') || 'Paid'}</div><div className="stat-value">₹{totalPaid}</div></div>
            <div className="surface stat"><div className="stat-title">{t('pending') || 'Pending'}</div><div className="stat-value" style={{ color: due > 0 ? 'var(--danger)' : 'var(--success)' }}>₹{due}</div></div>
          </div>

          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <input style={{ maxWidth: 180 }} type="number" placeholder={(t('amountMax') || 'Amount (max ₹') + due + ')'} value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
            <button className="btn primary" disabled={creating || due <= 0} onClick={payNow}>{creating ? (t('processing') || 'Processing...') : (t('payNow') || 'Pay Now')}</button>
          </div>

          <div className="section-title" style={{ marginTop: 24 }}>{t('paymentHistory') || 'Payment History'}</div>
          <table className="table surface">
            <thead><tr><th>{t('id') || 'ID'}</th><th>{t('amount') || 'Amount'}</th><th>{t('date') || 'Date'}</th><th>{t('method') || 'Method'}</th><th>{t('reference') || 'Reference'}</th><th>{t('receipt') || 'Receipt'}</th></tr></thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>₹{p.amount}</td>
                  <td>{p.date}</td>
                  <td>{p.method}</td>
                  <td>{p.reference}</td>
                  <td><Receipt payment={p} student={student} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
      <Modal open={successOpen} title={t('paymentSuccess') || 'Payment Successful'} onClose={() => setSuccessOpen(false)} footer={<button className="btn primary" onClick={() => setSuccessOpen(false)}>{t('great') || 'Great!'} 🎉</button>}>
        <div style={{ fontSize: 48, textAlign: 'center' }}>✅</div>
        <div style={{ textAlign: 'center', marginTop: 8 }}>{(t('paidOn') || 'Paid')} ₹{recent?.amount} {(t('on') || 'on')} {recent?.date}</div>
      </Modal>
    </div>
  )
}
