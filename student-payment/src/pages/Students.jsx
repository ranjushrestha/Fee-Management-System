import { useEffect, useMemo, useState } from "react";
import {
  listStudents,
  createStudent,
  deleteStudent,
  updateStudent,
} from "../services/students";
import { listClasses } from "../services/fees";
import { apiClient } from "../services/api";
import { getStudentFee } from "../services/fees";
import Modal from "../components/Modal";
import { useI18n } from "../i18n";

export default function Students() {
  const { t } = useI18n();
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    class: "",
    rollNumber: "",
    email: "",
    password: "",
  });
  const [usersIndex, setUsersIndex] = useState({});
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    rollNumber: "",
  });
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [s, c, u] = await Promise.all([
          listStudents(),
          listClasses(),
          apiClient.get("/users"),
        ]);
        setStudents(s);
        setClasses(c);
        const byStudent = u.data.reduce((acc, x) => {
          if (x.studentId != null) acc[String(x.studentId)] = x;
          return acc;
        }, {});
        setUsersIndex(byStudent);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const studentIdToPayments = usePaymentsIndex();

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    try {
      if (
        !form.name ||
        !form.class ||
        !form.rollNumber ||
        !form.email ||
        !form.password
      ) {
        setError("All fields required");
        return;
      }
      if (
        students.some((s) => String(s.rollNumber) === String(form.rollNumber))
      ) {
        setError("Roll no. must be unique");
        return;
      }
      const { email, password, ...rest } = form;
      const created = await createStudent({ ...rest, email });
      // create linked user crendential for student login
      await apiClient.post("/users", {
        name: form.name,
        email,
        password,
        role: "student",
        studentId: created.id,
      });
      setStudents((prev) => [...prev, created]);
      setUsersIndex((prev) => ({
        ...prev,
        [String(created.id)]: {
          name: form.name,
          email,
          password,
          role: "student",
          studentId: created.id,
        },
      }));
      setForm({ name: "", class: "", rollNumber: "", email: "", password: "" });
    } catch (err) {
      setEditForm(err.message || "Failed to add student");
    }
  }
  async function handleSaveEdit() {
    if (!editTarget) return;
    const updated = await updateStudent(editTarget.id, {
      name: editForm.name,
      class: editForm.class,
      rollNumber: editForm.rollNumber,
    });
    setStudents((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
    setEditTarget(null);
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    await deleteStudent(deleteTarget.id);
    try {
      const { data: users } = await apiClient.get("/users", {
        params: { studentId: String(deleteTarget.id) },
      });
      await Promise.all(users.map((u) => apiClient.delete(`/users/${u.id}`)));
    } catch (_) {}
    setStudents((prev) => prev.filter((s) => s.id !== deleteTarget.id));
    setDeleteTarget(null);
  }

  return (
    <div className="container">
      <h2>{t("students")}</h2>
      <div className="surface card" style={{ marginTop: 12 }}>
        <div className="section-title">{t("addStudent")}</div>
        <form
          onSubmit={handleConfirmDelete}
          className="form"
          style={{
            display: "grid",
            gridTemplateColumns: "repeact(5, 1fr)",
            gap: 12,
          }}
        >
          <input
            placeholder={t("name") || "Name"}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <select
            value={form.class}
            onChange={(e) => setForm({ ...form, class: e.target.value })}
          >
            <option value="">{t("selectClass")}</option>
            {classes.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            placeholder={t("rollNumber") || "Roll No."}
            value={rollNumber}
            onChange={(e) => setForm({ ...form, rollNumber: e.target.value })}
          />
          <input
            placeholder={t("email") || "Email"}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            type="email"
          />
          <input
            placeholder={t("password") || "Password"}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            type="password"
          />
          <button className="btn primary" type="submit">
            {t("add")}
          </button>
        </form>
        {error && (
          <div style={{ color: "var(--danger)", marginTop: 8 }}>{error}</div>
        )}
      </div>

      <div className="section-title" style={{ marginTop: 16 }}>
        {t("studentList")}
      </div>
      {loading ? (
        <div>{t("loading")}</div>
      ) : (
        <table className="table surface">
          <thead>
            <tr>
              <th>ID</th>
              <th>{t("name") || "Name"}</th>
              <th>{t("class") || "Class"}</th>
              <th>{t("rollNo") || "Roll No."}</th>
              <th>{t("username") || "Username"}</th>
              <th>{t("passcode") || "Passcode"}</th>
              <th>{t("totalFee") || "Fee"}</th>
              <th>{t("paid") || "Paid"}</th>
              <th>{t("pending") || "Due"}</th>
              <th>{t("actions") || "Actions"}</th>
            </tr>
          </thead>
          <tbody>
            {students.map(s => (
                <StudentRow
                key={s.id}
                student={s}
                credentials={usersIndex[String(s.id)]}
                payments={studentIdToPayments[s.rollNumber] || studentIdToPayments[s.id] || []}
                onEdit={() => { setEditTarget(s); setEditForm({ name: s.name, class: s.class, rollNumber: s.rollNumber})}}
                onDelete={() => setDeleteTarget(s)}
                />
            ))}
          </tbody>
        </table>
      )}

      {/*Edit Modal  */}
      <EditStudentModal
      open = {Boolean(editTarget)}
      student={editTarget}
      form={editForm}
      setForm={setEditForm}
      onClose={() => setEditTarget(null)}
      onSave={handleSaveEdit}
      />

      <DeleteStudentModal 
      open={Boolean(deleteTarget)}
      student={deleteTarget}
      onClose={() => setDeleteTarget(null)}
      onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

function usePaymentsIndex() {
    const [payments, setPayments] = useState([]);
    useEffect(() => { apiClient.get('/payments').then(r => setPayments(r.data))}, [])
    return useMemo(() => payments.reduce((acc, p) => {
        const key = String(p.studentRoll || p.studentId)
        acc[key] = acc[key] || []
        acc[key].push(p)
        return acc
    },{}),[payments])
};

function StudentRow({ student, payments, credentials, onEdit, onDelete}) {
   const {t} = useI18n();
   const [fee, setFee] = useState();
   const paid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0 )
   useEffect(() => {
    getStudentFee(student.id, student.class, student.rollNumber).then(setFee)
   }, [student.id, student.class, student.rollNumber])
   const due  =  Math.max(0, Number(fee) - Number(paid))
   return (
    <tr>
        <td>{student.id}</td>
        <td>{student.name}</td>
        <td>{student.class}</td>
        <td>{student.rollNumber}</td>
        <td>{credentials?.email}</td>
        <td>{credentials?.password}</td>
        <td>₹{fee}</td>
        <td>₹{paid}</td>
        <td style={{ color: due > 0 ? 'var(--danger)' : 'var(--success)'}}>₹{due}</td>
        <td>
            <div style={{ display: 'flex', gap: 8}}>
               <button className="btn" onClick={onEdit}>{t('edit') || 'Edit'}</button>
               <button className=" btn danger" onCanPlay={onDelete}>{t('delete') || 'Delete'}</button>
            </div>
        </td>
    </tr>
   )
}

function EditStudentModal({ open, form, setForm, onClose, onSave}) {
   const {t} = useI18n();
   return (
    <Modal open={open} title={t('edit') || 'Edit Student'} onClose={onClose} footer={
        <>
        <button className="btn" onClick={onClose}>{t('cancel') || 'Cancel'}</button>
        <button className="btn" onClick={onSave}>{t('save') || 'Save'}</button>
        </>
    }>
        <div className="form">
            <input placeholder={t('name') || 'Name'} value={form.name || ''} onChange={(e) => setForm({...form, name: e.target.value})} />
           <input placeholder={t('class') || 'Class'} value={form.class || ''} onChange={(e) => setForm({...form, class: e.target.value})} />
           <input placeholder={t('rollNumber') || 'Rolll No.'} value={form.rollNumber || ''} onChange={(e) => setForm({...form, rollNumber: e.target.value})} />
        </div>

    </Modal>
   )
}

function DeleteStudentModal({student, open, onClose, onConfirm}) {
 const {t} = useI18n();
 return (
    <Modal open={open} title={t('delete') || 'Delete'} onClose={onClose} footer={
        <>
        <button className="btn" onChange={onClose}>{t('cancel') || 'Cancel'}</button>
        <button className="btn" onChange={onConfirm}>{t('delete') || 'Delete'} </button>
        </> 
    }> 
    <div>{t('confirmDelete') || 'Are you sure you want to delete'}, <strong>{student?.name}</strong>?</div>

    </Modal>
 )
}