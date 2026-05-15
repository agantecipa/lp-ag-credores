import { useState, useEffect, useCallback, useRef } from "react";
import agLogoWhite from "@/assets/ag-logo-white.png";

const PROBLEM_LIST = [
  "Sua equipe comercial prospecta frio.",
  "O marketing gera curiosos.",
  "O CAC aumenta.",
  "O SDR vira filtro de lead ruim.",
  "E a operação continua dependente de indicação.",
];

const EXPERTISE_ITEMS = [
  "perfil de cedente",
  "qualidade de sacado",
  "comportamento de operação",
  "timing de caixa",
  "urgência financeira",
  "perfil de ticket",
  "maturidade do lead",
];

const COMPARATIVO_ROWS: Array<{ tradicional: string; ag: string }> = [
  { tradicional: "Contrata SDR", ag: "Recebe lead" },
  { tradicional: "Paga mídia sem garantia", ag: "Paga apenas sucesso" },
  { tradicional: "Alto CAC", ag: "CAC previsível" },
  { tradicional: "Leads frios", ag: "Leads qualificados" },
  { tradicional: "Time interno maior", ag: "Operação enxuta" },
];

type CountStat = {
  target: number;
  prefix?: string;
  suffix?: string;
  format?: (n: number) => string;
  label: string;
};

const ptbr = (n: number) => Math.round(n).toLocaleString("pt-BR");

const PROOF_STATS: CountStat[] = [
  { target: 20, prefix: "+", label: "Anos no mercado de crédito" },
  { target: 800, prefix: "+R$ ", suffix: "mi", label: "Em operações originadas" },
  { target: 1500, prefix: "+", format: ptbr, label: "Empresas atendidas" },
  { target: 600, suffix: "%", label: "De crescimento nos últimos 3 anos" },
];

function CountUp({
  target,
  start,
  prefix = "",
  suffix = "",
  format,
  duration = 1400,
}: {
  target: number;
  start: boolean;
  prefix?: string;
  suffix?: string;
  format?: (n: number) => string;
  duration?: number;
}) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!start) return;
    // Respeita usuários que pedem menos movimento
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(target);
      return;
    }
    let raf = 0;
    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setValue(target * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, start]);

  const formatted = format ? format(value) : String(Math.round(value));
  return (
    <>
      {prefix}
      {formatted}
      {suffix}
    </>
  );
}

const MODELO_STEPS: Array<{ title: string; desc?: string; points?: string[] }> = [
  {
    title: "A AG gera os leads",
    desc: "Tráfego, campanhas, qualificação e aquisição.",
  },
  {
    title: "Validamos o perfil",
    desc: "Empresas B2B com potencial para antecipação.",
  },
  {
    title: "Encaminhamos para sua operação",
    desc: "Você assume análise e fechamento.",
  },
  {
    title: "Só ganhamos se virar cliente",
    points: [
      "Sem mensalidade fixa.",
      "Sem custo por curiosidade.",
      "Sem risco comercial desnecessário.",
    ],
  },
];

const TIPO_OPERACAO_OPTIONS = ["Factoring", "Securitizadora", "FIDC", "Outro"];

function isValidEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  const basicValid = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i.test(normalized);
  if (!basicValid) return false;

  const [, domain = ""] = normalized.split("@");
  const hasCommonProviderTypo = /(gmail\.com|hotmail\.com|outlook\.com|yahoo\.com|icloud\.com|live\.com|msn\.com)[a-z]+$/i.test(domain);
  if (hasCommonProviderTypo) return false;
  const hasComBrTypo = /\.com\.br[a-z]+$/i.test(domain);
  if (hasComBrTypo) return false;

  return true;
}

// DDDs válidos no Brasil (Anatel)
const VALID_BR_DDDS = new Set([
  11,12,13,14,15,16,17,18,19,
  21,22,24,27,28,
  31,32,33,34,35,37,38,
  41,42,43,44,45,46,47,48,49,
  51,53,54,55,
  61,62,63,64,65,66,67,68,69,
  71,73,74,75,77,79,
  81,82,83,84,85,86,87,88,89,
  91,92,93,94,95,96,97,98,99,
]);

function isValidBRMobile(tel: string): boolean {
  const digits = tel.replace(/\D/g, "");
  if (digits.length !== 11) return false;
  const ddd = parseInt(digits.slice(0, 2), 10);
  if (!VALID_BR_DDDS.has(ddd)) return false;
  return digits[2] === "9";
}

const Index = () => {
  const [navVisible, setNavVisible] = useState(true);
  const [showCookieNotice, setShowCookieNotice] = useState(false);
  const [proofInView, setProofInView] = useState(false);
  const proofRef = useRef<HTMLElement>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [leadSent, setLeadSent] = useState(false);
  const [leadErrors, setLeadErrors] = useState<Record<string, boolean>>({});
  const [formStep, setFormStep] = useState<1 | 2>(1);

  // Lead fields (shared between modal + inline form)
  const [leadNome, setLeadNome] = useState("");
  const [leadEmpresa, setLeadEmpresa] = useState("");
  const [leadCargo, setLeadCargo] = useState("");
  const [leadTel, setLeadTel] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadTipoOp, setLeadTipoOp] = useState("");

  const handleLeadTelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, "").slice(0, 11);
    if (v.length > 6) v = `(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7)}`;
    else if (v.length > 2) v = `(${v.slice(0,2)}) ${v.slice(2)}`;
    else if (v.length > 0) v = `(${v}`;
    setLeadTel(v);
    setLeadErrors(er => ({ ...er, tel: false, telFormat: false }));
  };

  const openModal = useCallback(() => {
    setFormStep(1);
    setLeadErrors({});
    setModalOpen(true);
  }, []);

  const goToStep2 = useCallback(() => {
    const errors: Record<string, boolean> = {};
    if (!leadNome.trim()) errors.nome = true;
    if (!leadEmail.trim()) errors.email = true;
    else if (!isValidEmail(leadEmail)) errors.emailFormat = true;
    const telDigits = leadTel.replace(/\D/g, "");
    if (!telDigits) errors.tel = true;
    else if (!isValidBRMobile(leadTel)) errors.telFormat = true;
    setLeadErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setFormStep(2);
  }, [leadNome, leadEmail, leadTel]);

  const closeModal = useCallback(() => {
    setModalOpen(false);
  }, []);

  // Esc to close + body scroll lock
  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [modalOpen]);

  // Nav hide/show on hero leave
  useEffect(() => {
    const handleScroll = () => {
      const heroEl = document.getElementById("hero");
      const heroBottom = heroEl ? heroEl.getBoundingClientRect().bottom : 0;
      setNavVisible(heroBottom > 0);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  useEffect(() => {
    const accepted = window.localStorage.getItem("cookiesAccepted");
    setShowCookieNotice(accepted !== "true");
  }, []);

  // Dispara count-up dos stats quando a seção Trajetória entra na viewport
  useEffect(() => {
    const el = proofRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setProofInView(true);
          obs.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const acceptCookies = useCallback(() => {
    window.localStorage.setItem("cookiesAccepted", "true");
    setShowCookieNotice(false);
  }, []);

  const handleLeadSubmit = useCallback(async () => {
    const errors: Record<string, boolean> = {};
    if (!leadEmpresa.trim()) errors.empresa = true;
    if (!leadCargo.trim()) errors.cargo = true;
    if (!leadTipoOp) errors.tipoOp = true;
    setLeadErrors(errors);
    if (Object.keys(errors).length > 0) return;

    // TODO: integração com webhook/CRM será definida depois.
    // Por enquanto o submit apenas marca como enviado para teste de UX.
    setLeadSubmitting(true);
    await new Promise((r) => setTimeout(r, 400));
    setLeadSubmitting(false);
    setLeadSent(true);
  }, [leadEmpresa, leadCargo, leadTipoOp]);

  const renderLeadForm = () => (
    <>
      <div className="lead-form-stepper" aria-hidden="true">
        <div className={`lead-form-stepper-dot ${formStep >= 1 ? "active" : ""}`}></div>
        <div className={`lead-form-stepper-line ${formStep === 2 ? "active" : ""}`}></div>
        <div className={`lead-form-stepper-dot ${formStep >= 2 ? "active" : ""}`}></div>
      </div>

      {formStep === 1 ? (
        <>
          <div className="lead-form-fields">
            <div className={`form-group full ${leadErrors.nome ? "has-error" : ""}`}>
              <label>Nome completo</label>
              <input
                type="text"
                value={leadNome}
                placeholder="Seu nome completo"
                onChange={(e) => { setLeadNome(e.target.value); setLeadErrors(er => ({ ...er, nome: false })); }}
              />
              {leadErrors.nome && <span className="field-error">Preenchimento obrigatório</span>}
            </div>

            <div className={`form-group full ${leadErrors.email || leadErrors.emailFormat ? "has-error" : ""}`}>
              <label>E-mail corporativo</label>
              <input
                type="email"
                value={leadEmail}
                placeholder="seu@empresa.com"
                onChange={(e) => { setLeadEmail(e.target.value); setLeadErrors(er => ({ ...er, email: false, emailFormat: false })); }}
              />
              {leadErrors.email && <span className="field-error">Preenchimento obrigatório</span>}
              {leadErrors.emailFormat && <span className="field-error">Digite um e-mail válido</span>}
            </div>

            <div className={`form-group full ${leadErrors.tel || leadErrors.telFormat ? "has-error" : ""}`}>
              <label>WhatsApp</label>
              <input
                type="tel"
                value={leadTel}
                placeholder="(11) 99999-9999"
                onChange={handleLeadTelChange}
              />
              {leadErrors.tel && <span className="field-error">Preenchimento obrigatório</span>}
              {leadErrors.telFormat && <span className="field-error">Informe um WhatsApp válido (DDD + 9 + 8 dígitos)</span>}
            </div>
          </div>

          <button className="lead-cta" onClick={goToStep2}>
            <span>Continuar</span>
            <span className="cta-arrow" aria-hidden="true">→</span>
          </button>
        </>
      ) : (
        <>
          <button className="lead-form-back" type="button" onClick={() => setFormStep(1)}>← Voltar</button>

          <div className="lead-form-fields">
            <div className={`form-group full ${leadErrors.empresa ? "has-error" : ""}`}>
              <label>Empresa</label>
              <input
                type="text"
                value={leadEmpresa}
                placeholder="Razão social ou nome fantasia"
                onChange={(e) => { setLeadEmpresa(e.target.value); setLeadErrors(er => ({ ...er, empresa: false })); }}
              />
              {leadErrors.empresa && <span className="field-error">Preenchimento obrigatório</span>}
            </div>

            <div className={`form-group full ${leadErrors.cargo ? "has-error" : ""}`}>
              <label>Cargo</label>
              <input
                type="text"
                value={leadCargo}
                placeholder="Seu cargo na empresa"
                onChange={(e) => { setLeadCargo(e.target.value); setLeadErrors(er => ({ ...er, cargo: false })); }}
              />
              {leadErrors.cargo && <span className="field-error">Preenchimento obrigatório</span>}
            </div>

            <div className={`form-group full ${leadErrors.tipoOp ? "has-error" : ""}`}>
              <label>Tipo de operação</label>
              <select
                value={leadTipoOp}
                onChange={(e) => { setLeadTipoOp(e.target.value); setLeadErrors(er => ({ ...er, tipoOp: false })); }}
              >
                <option value="">Selecione</option>
                {TIPO_OPERACAO_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              {leadErrors.tipoOp && <span className="field-error">Selecione uma opção</span>}
            </div>
          </div>

          <button className="lead-cta" onClick={handleLeadSubmit} disabled={leadSubmitting}>
            <span>{leadSubmitting ? "Enviando..." : "Enviar"}</span>
            {!leadSubmitting && <span className="cta-arrow" aria-hidden="true">→</span>}
          </button>

          <p className="lead-consent">
            Ao cadastrar você concorda em fornecer seus dados para receber o contato da AG Antecipa.
          </p>
        </>
      )}
    </>
  );

  return (
    <>
      {/* NAV */}
      <nav className={navVisible ? "" : "nav-hidden"}>
        <a href="#" className="logo">
          <img src={agLogoWhite} alt="AG Antecipa" className="logo-img" />
        </a>
        <ul className="nav-links">
          <li><button type="button" className="nav-cta" onClick={openModal}>Quero leads qualificados</button></li>
        </ul>
      </nav>

      {/* HERO */}
      <section className="hero" id="hero">
        <div className="hero-backdrop" aria-hidden="true">
          <div className="hero-grid"></div>
          <div className="hero-rule top"></div>
          <div className="hero-rule bottom"></div>
        </div>

        <div className="hero-content">
          <span className="hero-anchor" aria-hidden="true"></span>

          <h1 className="hero-headline">
            <span className="hl-line hl-muted">Você fecha as operações.</span>
            <span className="hl-line hl-bright">Nós geramos os clientes.</span>
          </h1>

          <p className="hero-support">
            A AG origina empresas interessadas em antecipação de recebíveis para factorings, securitizadoras e FIDCs — e só ganha quando o lead vira operação.
          </p>

          <div className="hero-cta-row">
            <button className="hero-cta-btn" onClick={openModal}>
              <span>Quero receber leads qualificados</span>
              <span className="cta-arrow" aria-hidden="true">→</span>
            </button>
          </div>

          <div className="hero-trust" aria-label="Track record AG Antecipa">
            <span className="hero-trust-item">
              <strong><CountUp target={20} start={true} prefix="+" duration={1200} /></strong> anos no mercado
            </span>
            <span className="hero-trust-sep" aria-hidden="true"></span>
            <span className="hero-trust-item">
              <strong><CountUp target={800} start={true} prefix="+R$ " suffix="mi" duration={1200} /></strong> originados
            </span>
            <span className="hero-trust-sep" aria-hidden="true"></span>
            <span className="hero-trust-item">
              <strong><CountUp target={1500} start={true} prefix="+" format={ptbr} duration={1200} /></strong> empresas
            </span>
          </div>
        </div>
      </section>

      {/* DIAGNÓSTICO */}
      <section className="diagnostico" id="diagnostico">
        <div className="diagnostico-grid">
          <div className="diagnostico-head">
            <span className="diagnostico-label" aria-hidden="true">
              <span className="section-num">01</span>
              <span className="diagnostico-label-line"></span>
              <span>Diagnóstico</span>
            </span>
            <h2 className="diagnostico-title">
              O mercado ainda tenta crescer do jeito mais caro possível.
            </h2>
          </div>

          <div className="diagnostico-body">
            <ol className="diagnostico-list">
              {PROBLEM_LIST.map((item, i) => (
                <li key={i} className="diagnostico-item">
                  <span className="diagnostico-num">{String(i + 1).padStart(2, "0")}</span>
                  <span className="diagnostico-text">{item}</span>
                </li>
              ))}
            </ol>

            <div className="diagnostico-cta-row">
              <button className="diagnostico-cta" onClick={openModal}>
                <span>Quero receber leads qualificados</span>
                <span className="cta-arrow" aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* MODELO DE ENGAJAMENTO */}
      <section className="modelo" id="modelo">
        <div className="modelo-inner">
          <div className="modelo-head">
            <span className="modelo-label" aria-hidden="true">
              <span className="section-num">02</span>
              <span className="modelo-label-line"></span>
              <span>Modelo de engajamento</span>
            </span>
            <h2 className="modelo-title">Você só paga pelo sucesso.</h2>
          </div>

          <ol className="modelo-steps">
            {MODELO_STEPS.map((step, i) => (
              <li key={i} className={`modelo-step ${i === MODELO_STEPS.length - 1 ? "modelo-step-final" : ""}`}>
                <span className="modelo-step-num">{String(i + 1).padStart(2, "0")}</span>
                <span className="modelo-step-divider" aria-hidden="true"></span>
                <h3 className="modelo-step-title">{step.title}</h3>
                {step.desc && <p className="modelo-step-desc">{step.desc}</p>}
                {step.points && (
                  <ul className="modelo-step-points">
                    {step.points.map((p, j) => (
                      <li key={j}>{p}</li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ol>

          <div className="modelo-cta-row">
            <button className="modelo-cta" onClick={openModal}>
              <span>Quero conhecer o projeto de originação</span>
              <span className="cta-arrow" aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </section>

      {/* TRAJETÓRIA — track record */}
      <section className="proof" id="proof" ref={proofRef}>
        <div className="proof-inner">
          <div className="proof-head">
            <span className="proof-label" aria-hidden="true">
              <span className="section-num">03</span>
              <span className="proof-label-line"></span>
              <span>Trajetória</span>
            </span>
            <h2 className="proof-title">
              Não estamos começando a aprender originação agora.
            </h2>
          </div>

          <div className="proof-stats">
            {PROOF_STATS.map((stat, i) => (
              <div key={i} className="proof-stat">
                <div className="proof-stat-num">
                  <CountUp
                    target={stat.target}
                    start={proofInView}
                    prefix={stat.prefix}
                    suffix={stat.suffix}
                    format={stat.format}
                  />
                </div>
                <div className="proof-stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ESPECIALIZAÇÃO */}
      <section className="expertise" id="expertise">
        <div className="expertise-inner">
          <div className="expertise-head">
            <span className="expertise-label" aria-hidden="true">
              <span className="section-num">04</span>
              <span className="expertise-label-line"></span>
              <span>Especialização</span>
            </span>
            <h2 className="expertise-title">
              Nós entendemos o lead porque operamos o mercado.
            </h2>
            <div className="expertise-intro">
              <p>Não somos uma agência tentando aprender crédito.</p>
              <p>Somos uma operação que já originou centenas de milhões em recebíveis e entende:</p>
            </div>
          </div>

          <ul className="expertise-list">
            {EXPERTISE_ITEMS.map((item, i) => (
              <li key={i} className="expertise-item">
                <span className="expertise-dash" aria-hidden="true">—</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <p className="expertise-closing">
            Isso aumenta drasticamente a qualidade da originação.
          </p>

          <div className="expertise-cta-row">
            <button className="expertise-cta" onClick={openModal}>
              <span>Quero receber leads qualificados</span>
              <span className="cta-arrow" aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </section>

      {/* COMPARATIVO */}
      <section className="comparativo" id="comparativo">
        <div className="comparativo-inner">
          <div className="comparativo-head">
            <span className="comparativo-label" aria-hidden="true">
              <span className="section-num">05</span>
              <span className="comparativo-label-line"></span>
              <span>Comparativo</span>
            </span>
            <h2 className="comparativo-title">
              Sem custo fixo. Sem risco de aquisição.
            </h2>
          </div>

          <div className="comparativo-table" role="table" aria-label="Comparativo entre modelo tradicional e modelo AG">
            <div className="comparativo-row comparativo-row-header" role="row">
              <div className="comparativo-cell comparativo-cell-trad" role="columnheader">
                Modelo tradicional
              </div>
              <div className="comparativo-cell comparativo-cell-ag" role="columnheader">
                Modelo AG
              </div>
            </div>
            {COMPARATIVO_ROWS.map((row, i) => (
              <div key={i} className="comparativo-row" role="row">
                <div className="comparativo-cell comparativo-cell-trad" role="cell">
                  <span className="comparativo-mark comparativo-mark-trad" aria-hidden="true">−</span>
                  <span>{row.tradicional}</span>
                </div>
                <div className="comparativo-cell comparativo-cell-ag" role="cell">
                  <span className="comparativo-mark comparativo-mark-ag" aria-hidden="true">+</span>
                  <span>{row.ag}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="comparativo-cta-row">
            <button className="comparativo-cta" onClick={openModal}>
              <span>Quero receber leads qualificados</span>
              <span className="cta-arrow" aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </section>

      {/* CONTATO — última seção com formulário inline */}
      <section className="contato" id="contato">
        <div className="contato-grid">
          <div className="contato-head">
            <span className="contato-label" aria-hidden="true">
              <span className="section-num">06</span>
              <span className="contato-label-line"></span>
              <span>Conversar</span>
            </span>
            <h2 className="contato-title">
              <span className="hl-line hl-muted">Sua operação não precisa de mais prospecção fria.</span>
              <span className="hl-line hl-bright">Precisa de empresas prontas para conversar.</span>
            </h2>
          </div>

          <div className="contato-card lead-form">
            {!leadSent ? (
              <>
                <div className="contato-card-header">
                  <h3 className="contato-card-title">Receba leads qualificados</h3>
                </div>
                {renderLeadForm()}
              </>
            ) : (
              <div className="lead-success">
                <div className="lead-success-icon" aria-hidden="true">✓</div>
                <h3 className="contato-card-title">Recebemos seus dados</h3>
                <p className="lead-success-text">
                  Em breve, nosso time entrará em contato para qualificar a parceria.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer-brand">
          <img src={agLogoWhite} alt="AG Antecipa" className="footer-logo-img" />
          +20 anos antecipando recebíveis com atendimento que funciona. Estrutura sólida, promessas cumpridas.
        </div>
        <div className="footer-legal">
          © 2026 AG Antecipa. Todos os direitos reservados.
        </div>
      </footer>

      {showCookieNotice && (
        <div className="cookie-notice" role="status" aria-live="polite">
          <p>Usamos cookies para personalizar conteúdos e melhorar a sua experiência.</p>
          <button className="cookie-notice-btn" onClick={acceptCookies}>Ok, entendi</button>
        </div>
      )}

      {/* LEAD MODAL */}
      {modalOpen && (
        <div className="lead-modal-backdrop" onClick={closeModal} role="dialog" aria-modal="true" aria-labelledby="lead-modal-title">
          <div className="lead-modal lead-form" onClick={(e) => e.stopPropagation()}>
            <button className="lead-modal-close" onClick={closeModal} aria-label="Fechar">×</button>

            {!leadSent ? (
              <>
                <div className="lead-modal-header">
                  <h2 className="lead-modal-title" id="lead-modal-title">Receba leads qualificados</h2>
                </div>
                {renderLeadForm()}
              </>
            ) : (
              <div className="lead-success">
                <div className="lead-success-icon" aria-hidden="true">✓</div>
                <h2 className="lead-modal-title">Recebemos seus dados</h2>
                <p className="lead-success-text">
                  Em breve, nosso time entrará em contato para qualificar a parceria.
                </p>
                <button className="lead-cta" onClick={closeModal}>Fechar</button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Index;
