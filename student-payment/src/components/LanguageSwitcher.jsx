import { useI18n } from "../i18n";

export default function LanguageSwitcher () {
    const {lang, setLang, t} = useI18n()
    return (
        <div style={ {display: 'inline-flex', alignItems: 'center', gap: 8}}>;
            <span style = {{ color: 'var(--muted', fontSize: 14}}>{t('language')}:</span>;
            <select value={lang} onChange={(e) => setLang(e.target.value)} className="btn" style={{ padding: '6px 10px' }}></select>;
            <option value="en">English</option>
            <option value="ne">नेपाली</option>
        </div>
    )
};
