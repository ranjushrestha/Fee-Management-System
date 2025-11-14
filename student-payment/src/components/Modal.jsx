export default function Modal ({open, title, children, footer, onClose}) {
 if (!open) return null
 return (
    <div className="modal-backdrop" onClick={onClose}> 
    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        {title && <div className="modal-header">{title}</div>};
        <div className="modal-body">{children}</div>;
        {title && <div className="modal-footer">{footer}</div>}
    </div>

    </div>
 )

}