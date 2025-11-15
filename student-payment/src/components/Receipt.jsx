import { useI18n } from '../i18n.jsx'

export default function Receipt ({payment, student}) {
  const {t} = useI18n()
  const {id, amount, data, method, reference} = payment;
  const printable = () => {
    const content = document.getElementById(`receipt-${id}`);
     const win = window.open('', '', 'width=720, height=900')
     win.document.write('<html><head><title>Receipt</title>')
     win.document.write('<style>body{font-family:ui-sans-serif,system-ui; padding: 25px} .box{border: 1px solid #ccc; padding:16px  border-radius:8px} h2{margin:0 0 12px 0}</style>}');
     win.document.write('</head><body>')
     win.document.write(content.innerHTML)
     win.document.write('</body></html>')
     win.document(close)
     win.focus()
     win.print()
     win.close();
  }
  return (
    <div>
    <div id={`receipt-${id}`} style= {{display: 'none'}}>
         <div className="box">
            <h2>{ t ('feeReceipt') || 'Fee Receipt'}</h2>
            <div><strong>{ t ('receiptNo') || 'Receipt No'}:</strong>{id}</div>
            <div><strong>{ t ('date') || 'Date'}</strong>{date}</div>
            <hr />
            <div><strong>{ t ('student') || 'Student'}:</strong> {student?.name} (ID: {student?.id})</div>
            <div><strong>{ t ('class') || 'Class'}:</strong>{student?.class}</div>
            <hr />
            <div><strong>{ t ('amount') || 'Amount'}:</strong>₹{amount}</div>
            <div><strong>{ t ('method') || 'Method' }:</strong>{method}</div>
            <div><strong>{ t ('reference') || "Reference"}:</strong>{reference || '-'}</div>
         </div>
    </div>
    <button className='btn' onClick={printable}>{t('printReceipt') || 'Print Receipt'}</button>
    </div>
  )
}