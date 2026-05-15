import { useState, useEffect, useRef, useCallback } from "react";
import agLogoWhite from "@/assets/ag-logo-white.png";
import ctaBgImage from "@/assets/cta-bg.png";

const ESTADOS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS",
  "MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"
];

const FAQ_DATA = [
  { q: "O imóvel precisa estar quitado?", a: "Não necessariamente. Em alguns casos, imóveis ainda financiados podem ser aceitos. Fale com nosso especialista para verificar a sua situação específica." },
  { q: "Posso usar o crédito para qualquer finalidade?", a: "Sim. Capital de giro, expansão, quitação de dívidas, investimento. Você decide como usar, sem restrições de finalidade." },
  { q: "Meu imóvel fica bloqueado durante o contrato?", a: "Não. O imóvel é dado apenas como garantia, e você pode utilizá-lo normalmente durante todo o período." },
  { q: "Quais imóveis são aceitos como garantia?", a: "Aceitamos imóveis residenciais como apartamentos, casas de rua e casas em condomínio, e também imóveis comerciais. Entre em contato para verificar o seu caso específico." },
  { q: "Quanto posso contratar?", a: "Até 60% do valor de avaliação do imóvel, com prazo de até 240 meses para pagamento." },
  { q: "Em quanto tempo o dinheiro cai na conta?", a: "Após a assinatura do contrato e o registro do imóvel, o crédito é liberado em até 5 dias úteis. Nossos parceiros acompanham cada etapa para garantir que tudo aconteça no prazo." },
];

function formatSliderValue(val: number): string {
  if (val >= 1000000) {
    const m = val / 1000000;
    const mStr = (Number.isInteger(m) ? m : m.toFixed(1)).toString().replace(".", ",");
    return `R$ ${mStr} ${m <= 1 ? "milhão" : "milhões"}`;
  }
  return `R$ ${(val / 1000).toFixed(0)} mil`;
}

function scrollToForm() {
  const el = document.getElementById("form");
  if (!el) return;
  const navHeight = 70;
  const y = el.getBoundingClientRect().top + window.scrollY - navHeight;
  window.scrollTo({ top: y, behavior: "smooth" });
}

function isValidEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  const basicValid = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i.test(normalized);
  if (!basicValid) return false;

  const [, domain = ""] = normalized.split("@");

  // Bloqueia typos comuns em domínios de e-mail populares (ex.: gmail.coma).
  const hasCommonProviderTypo = /(gmail\.com|hotmail\.com|outlook\.com|yahoo\.com|icloud\.com|live\.com|msn\.com)[a-z]+$/i.test(domain);
  if (hasCommonProviderTypo) return false;

  // Bloqueia sufixos acidentalmente digitados após ".com.br" (ex.: uol.com.bra).
  const hasComBrTypo = /\.com\.br[a-z]+$/i.test(domain);
  if (hasComBrTypo) return false;

  return true;
}

const SLIDER_MIN = 50000;
const SLIDER_STEP = 10000;
const SLIDER_HARD_MAX = 10000000;
const VALOR_IMOVEL_MIN = 100000;

function formatThousands(digits: string): string {
  if (!digits) return "";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

const Index = () => {
  const [formStep, setFormStep] = useState(1);
  const [sliderVal, setSliderVal] = useState(SLIDER_MIN);
  const [isQuitado, setIsQuitado] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [barsAnimated, setBarsAnimated] = useState(false);
  const [navVisible, setNavVisible] = useState(true);
  const chartRef = useRef<HTMLDivElement>(null);

  // Form state
  const [celular, setCelular] = useState("");
  const [estado, setEstado] = useState("");
  const [cidade, setCidade] = useState("");
  const [cidades, setCidades] = useState<string[]>([]);
  const [loadingCidades, setLoadingCidades] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, boolean>>({});
  const [valorImovel, setValorImovel] = useState("");
  const [tipoImovel, setTipoImovel] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showCookieNotice, setShowCookieNotice] = useState(false);

  // Phone mask (XX) XXXXX-XXXX
  const handleCelularChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, "").slice(0, 11);
    if (v.length > 6) v = `(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7)}`;
    else if (v.length > 2) v = `(${v.slice(0,2)}) ${v.slice(2)}`;
    else if (v.length > 0) v = `(${v}`;
    setCelular(v);
  };

  // Fetch cities from IBGE API when state changes
  useEffect(() => {
    if (!estado) { setCidades([]); setCidade(""); return; }
    setLoadingCidades(true);
    setCidade("");
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${estado}/municipios?orderBy=nome`)
      .then(r => r.json())
      .then((data: Array<{ nome: string }>) => {
        setCidades(data.map(c => c.nome));
      })
      .catch(() => setCidades([]))
      .finally(() => setLoadingCidades(false));
  }, [estado]);

  // Nav hide/show logic
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

  const acceptCookies = useCallback(() => {
    window.localStorage.setItem("cookiesAccepted", "true");
    setShowCookieNotice(false);
  }, []);

  // Valor do imóvel (digits-only) and derived helpers
  const valorImovelNum = parseInt(valorImovel || "0", 10);
  const valorImovelValid = valorImovelNum >= VALOR_IMOVEL_MIN;
  const valorImovelDisplay = formatThousands(valorImovel);

  const dynamicMax = valorImovelValid
    ? Math.min(Math.floor((valorImovelNum * 0.6) / SLIDER_STEP) * SLIDER_STEP, SLIDER_HARD_MAX)
    : SLIDER_HARD_MAX;

  // Auto-clamp slider value when valor do imóvel reduces the max
  useEffect(() => {
    if (valorImovelValid && sliderVal > dynamicMax) {
      setSliderVal(dynamicMax);
    }
  }, [dynamicMax, valorImovelValid, sliderVal]);

  // Slider track color (range relative to current dynamic max)
  const sliderRange = Math.max(dynamicMax - SLIDER_MIN, 1);
  const sliderPct = Math.max(0, Math.min(100, ((sliderVal - SLIDER_MIN) / sliderRange) * 100));
  const sliderBg = `linear-gradient(to right, var(--teal) ${sliderPct}%, rgba(255,255,255,0.1) ${sliderPct}%)`;

  // Chart animation via IntersectionObserver
  useEffect(() => {
    const el = chartRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setBarsAnimated(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleSubmitForm = useCallback(async () => {
    const name = (document.getElementById("f-nome") as HTMLInputElement)?.value.trim() || "";
    const email = (document.getElementById("f-email") as HTMLInputElement)?.value.trim() || "";
    const tel = celular;
    const cel = celular.replace(/\D/g, "");

    const errors: Record<string, boolean> = {};
    if (!name) errors.nome = true;
    if (!email) errors.email = true;
    else if (!isValidEmail(email)) errors.emailFormat = true;
    if (cel.length < 11) errors.cel = true;
    if (!estado) errors.estado = true;
    if (!cidade) errors.cidade = true;
    if (!valorImovel) errors.valorImovel = true;
    else if (valorImovelNum < VALOR_IMOVEL_MIN) errors.valorImovelMin = true;
    if (!tipoImovel) errors.tipoImovel = true;
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const params = new URLSearchParams(window.location.search);
    const utms = {
      utm_source: params.get("utm_source") || "",
      utm_medium: params.get("utm_medium") || "",
      utm_campaign: params.get("utm_campaign") || "",
      utm_id: params.get("utm_id") || "",
      utm_term: params.get("utm_term") || "",
      utm_content: params.get("utm_content") || "",
    };

    const payload = {
      name,
      email,
      tel,
      estado,
      cidade,
      valor_credito: formatThousands(String(sliderVal)),
      valor_imovel: valorImovelDisplay,
      imovel_quitado: isQuitado ? "Sim" : "Não",
      tipo_imovel: tipoImovel,
      ...utms,
      page_url: window.location.href,
      submitted_at: new Date().toISOString(),
    };

    setSubmitting(true);
    try {
      const response = await fetch("https://hook.us2.make.com/9jdepnqdpi1od4tkpeel61yx6r9klw5h", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const w = window as unknown as { dataLayer: Record<string, unknown>[] };
        w.dataLayer = w.dataLayer || [];
        w.dataLayer.push({
          event: "submit-home",
          name,
          email,
          tel,
          estado,
          cidade,
          valor_credito: sliderVal,
          valor_imovel: valorImovelNum,
          imovel_quitado: isQuitado ? "Sim" : "Não",
          tipo_imovel: tipoImovel,
          utm_source: utms.utm_source,
          utm_medium: utms.utm_medium,
          utm_campaign: utms.utm_campaign,
          utm_id: utms.utm_id,
          utm_term: utms.utm_term,
          utm_content: utms.utm_content,
          page_url: window.location.href,
          submitted_at: new Date().toISOString(),
        });

        window.setTimeout(() => {
          window.location.href = "https://antecipacao.agantecipa.com.br/obrigado-cadastro";
        }, 300);
      }
    } catch (err) {
      console.error("Webhook error:", err);
    } finally {
      setSubmitting(false);
    }
  }, [celular, estado, cidade, sliderVal, valorImovel, valorImovelDisplay, valorImovelNum, isQuitado, tipoImovel]);

  const goStep2 = useCallback(() => {
    const nome = (document.getElementById("f-nome") as HTMLInputElement)?.value.trim();
    const email = (document.getElementById("f-email") as HTMLInputElement)?.value.trim();
    const cel = celular.replace(/\D/g, "");
    const errors: Record<string, boolean> = {};
    if (!nome) errors.nome = true;
    if (!email) errors.email = true;
    else if (!isValidEmail(email)) errors.emailFormat = true;
    if (cel.length < 11) errors.cel = true;
    if (!estado) errors.estado = true;
    if (!cidade) errors.cidade = true;
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setFormStep(2);
  }, [celular, estado, cidade]);

  return (
    <>
      {/* NAV */}
      <nav className={navVisible ? "" : "nav-hidden"}>
        <a href="#" className="logo">
          <img src={agLogoWhite} alt="AG Antecipa" className="logo-img" />
        </a>
        <ul className="nav-links">
          <li><a href="#como-funciona">Como Funciona</a></li>
          <li><a href="#form" className="nav-cta">Simular Agora</a></li>
        </ul>
      </nav>

      {/* HERO */}
      <section className="hero" id="hero">
        <div className="hero-media-mobile" aria-hidden="true"></div>
        <div className="hero-content">
          <img src={agLogoWhite} alt="AG Antecipa" className="hero-mobile-logo" />
          <div className="hero-badge"><span></span> Home Equity</div>
          <h1 className="hero-headline">
            Seu imóvel como <em>garantia de crédito.</em>
          </h1>
          <p className="hero-support">
            É o seu <em style={{ fontStyle: "normal", color: "var(--teal)", fontWeight: 700 }}>patrimônio</em> trabalhando por você. Com a AG Antecipa, você acessa as menores taxas do mercado com atendimento próximo do início ao fim.
          </p>
          <div className="hero-metrics">
            <div className="metric">
              <span className="metric-prefix">a partir de</span>
              <span className="metric-val">1,09%</span>
              <span className="metric-label">a.m. + IPCA</span>
            </div>
            <div className="metric">
              <span className="metric-prefix">até</span>
              <span className="metric-val">240x</span>
              <span className="metric-label">meses para pagar</span>
            </div>
            <div className="metric">
              <span className="metric-prefix">até</span>
              <span className="metric-val">60%</span>
              <span className="metric-label">do valor do imóvel</span>
            </div>
          </div>
        </div>

        <div className="form-box" id="form">
          {/* STEP INDICATOR */}
          <div className="step-indicator">
            <div className={`step-dot ${formStep === 1 ? "active" : "done"}`}></div>
            <div className={`step-line-indicator ${formStep === 2 ? "active" : ""}`}></div>
            <div className={`step-dot ${formStep === 2 ? "active" : ""}`}></div>
          </div>

          {/* STEP 1 */}
          <div className={`form-step ${formStep !== 1 ? "hidden" : ""}`}>
            <div className="form-title">Faça sua simulação gratuita</div>
            <div className="form-sub">Etapa 1 de 2 · Sobre você</div>
            <div className="form-grid">
              <div className={`form-group full ${formErrors.nome ? "has-error" : ""}`}>
                <label>Nome Completo</label>
                <input type="text" id="f-nome" placeholder="Seu nome completo" onChange={() => setFormErrors(e => ({...e, nome: false}))} />
                {formErrors.nome && <span className="field-error">Preenchimento obrigatório</span>}
              </div>
              <div className={`form-group ${formErrors.email || formErrors.emailFormat ? "has-error" : ""}`}>
                <label>E-mail</label>
                <input type="email" id="f-email" placeholder="seu@email.com" onChange={() => setFormErrors(e => ({...e, email: false, emailFormat: false}))} />
                {formErrors.email && <span className="field-error">Preenchimento obrigatório</span>}
                {formErrors.emailFormat && <span className="field-error">Digite um e-mail válido</span>}
              </div>
              <div className={`form-group ${formErrors.cel ? "has-error" : ""}`}>
                <label>Celular</label>
                <input type="tel" id="f-cel" placeholder="(11) 99999-9999" value={celular} onChange={(ev) => { handleCelularChange(ev); setFormErrors(e => ({...e, cel: false})); }} />
                {formErrors.cel && <span className="field-error">Preenchimento obrigatório</span>}
              </div>
              <div className={`form-group ${formErrors.estado ? "has-error" : ""}`}>
                <label>Estado</label>
                <select value={estado} onChange={(e) => { setEstado(e.target.value); setFormErrors(er => ({...er, estado: false})); }}>
                  <option value="">Selecione</option>
                  {ESTADOS.map((uf) => (
                    <option key={uf} value={uf}>{uf}</option>
                  ))}
                </select>
                {formErrors.estado && <span className="field-error">Preenchimento obrigatório</span>}
              </div>
              <div className={`form-group ${formErrors.cidade ? "has-error" : ""}`}>
                <label>Cidade</label>
                <select value={cidade} onChange={(e) => { setCidade(e.target.value); setFormErrors(er => ({...er, cidade: false})); }} disabled={!estado || loadingCidades}>
                  <option value="">{loadingCidades ? "Carregando..." : estado ? "Selecione a cidade" : "Selecione o estado primeiro"}</option>
                  {cidades.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                {formErrors.cidade && <span className="field-error">Preenchimento obrigatório</span>}
              </div>
            </div>
            <button className="btn-cta" onClick={goStep2}>Continuar</button>
            <div className="form-security">🔒 Seus dados estão protegidos. Sem compromisso.</div>
          </div>

          {/* STEP 2 */}
          <div className={`form-step ${formStep !== 2 ? "hidden" : ""}`}>
            <button className="step-back" onClick={() => setFormStep(1)}>← Voltar</button>
            <div className="form-title">Sobre o imóvel</div>
            <div className="form-sub">Etapa 2 de 2 · Informações do crédito</div>
            <div className="form-grid">
              <div className={`form-group full ${formErrors.valorImovel || formErrors.valorImovelMin ? "has-error" : ""}`}>
                <label>Valor estimado do imóvel</label>
                <div className="input-currency">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Ex: 500.000"
                    value={valorImovelDisplay}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 9);
                      setValorImovel(digits);
                      setFormErrors(er => ({ ...er, valorImovel: false, valorImovelMin: false }));
                    }}
                  />
                </div>
                <span className="field-hint">Mínimo R$ 100.000,00</span>
                {formErrors.valorImovel && <span className="field-error">Preenchimento obrigatório</span>}
                {formErrors.valorImovelMin && <span className="field-error">Trabalhamos com imóveis a partir de R$ 100.000</span>}
              </div>
              <div className="form-group full">
                <label>Quanto você precisa?</label>
                <div className={`slider-wrapper ${!valorImovelValid ? "is-disabled" : ""}`}>
                  {valorImovelValid ? (
                    <div className="slider-value">{formatSliderValue(sliderVal)}</div>
                  ) : (
                    <div className="slider-placeholder">Informe o valor do imóvel acima para liberar a simulação</div>
                  )}
                  <input
                    type="range"
                    min={SLIDER_MIN}
                    max={dynamicMax}
                    step={SLIDER_STEP}
                    value={Math.min(sliderVal, dynamicMax)}
                    onChange={(e) => setSliderVal(Number(e.target.value))}
                    disabled={!valorImovelValid}
                    style={{ background: sliderBg }}
                  />
                  <div className="slider-labels">
                    <span>R$ 50 mil</span>
                    <span>{valorImovelValid ? formatSliderValue(dynamicMax) : "—"}</span>
                  </div>
                </div>
              </div>
              <div className="form-group full">
                <label>O imóvel é quitado?</label>
                <div className="form-radio-group">
                  <div className={`radio-btn ${isQuitado ? "active" : ""}`} onClick={() => setIsQuitado(true)}>Sim</div>
                  <div className={`radio-btn ${!isQuitado ? "active" : ""}`} onClick={() => setIsQuitado(false)}>Não</div>
                </div>
              </div>
              <div className={`form-group full ${formErrors.tipoImovel ? "has-error" : ""}`}>
                <label>Tipo de imóvel</label>
                <select value={tipoImovel} onChange={(e) => { setTipoImovel(e.target.value); setFormErrors(er => ({...er, tipoImovel: false})); }}>
                  <option value="">Selecione</option>
                  <option>Apartamento</option>
                  <option>Casa em condomínio</option>
                  <option>Casa de rua</option>
                  <option>Imóvel comercial</option>
                  <option>Terreno</option>
                </select>
                {formErrors.tipoImovel && <span className="field-error">Preenchimento obrigatório</span>}
              </div>
            </div>
            <button className="btn-cta" onClick={handleSubmitForm} disabled={submitting}>
              {submitting ? "Enviando..." : "Simular gratuitamente"}
            </button>
            <div className="form-security">🔒 Seus dados estão protegidos. Sem compromisso.</div>
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="how" id="como-funciona">
        <div className="section-tag">Passo a passo</div>
        <h2 className="section-title">
          Do pedido ao dinheiro na conta:<br /><em>simples assim.</em>
        </h2>
        <div className="steps">
          {[
            { num: "01", title: "Preencha o formulário", desc: "Sem compromisso. Em minutos já iniciamos sua simulação." },
            { num: "02", title: "Análise de parceiros", desc: "Escolha do parceiro ideal para o seu perfil e necessidade." },
            { num: "03", title: "Avaliação do imóvel", desc: "Nossos parceiros cuidam de tudo." },
            { num: "04", title: "Assinatura do contrato", desc: "Simples e prático." },
            { num: "05", title: "Registro", desc: "Acompanhamento em cada etapa." },
            { num: "06", title: "Dinheiro na conta", desc: "Crédito liberado com agilidade e segurança." },
          ].map((s) => (
            <div className="step" key={s.num}>
              <div className="step-num">{s.num}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
        <div className="how-footer">
          🤝 Na AG Antecipa, todo o processo conta com um especialista dedicado. <strong style={{ color: "var(--white)" }}>Você nunca fica no escuro.</strong>
        </div>
        <div className="section-cta centered">
          <button className="btn-primary" onClick={scrollToForm}>Começar minha simulação</button>
        </div>
      </section>

      {/* O QUE É */}
      <section className="what-is">
        <div className="what-is-visual">
          <div style={{ fontSize: '0.9rem', color: 'var(--teal)', marginBottom: 2, letterSpacing: 1 }}>A partir de</div>
          <div className="big-number">1,09%</div>
          <div className="big-label">a.m. + IPCA · menor taxa do mercado</div>
          <ul className="what-is-list">
            <li>Seu imóvel é apenas a garantia e faz o seu patrimônio trabalhar a seu favor</li>
            <li>Você usa o bem apenas como garantia e pode utilizá-lo normalmente</li>
            <li>Crédito aprovado com base no valor do imóvel, não só no histórico bancário</li>
            <li>Taxas muito abaixo do empréstimo pessoal, cheque especial e cartão rotativo</li>
          </ul>
          <div className="section-cta" style={{ marginTop: 32 }}>
            <button className="btn-primary" onClick={scrollToForm}>Simular gratuitamente</button>
          </div>
        </div>
        <div>
          <div className="section-tag">Entenda</div>
          <h2 className="section-title">O que é o Empréstimo com <em>Garantia de Imóvel?</em></h2>
          <p className="section-sub" style={{ maxWidth: "100%", marginBottom: 24 }}>
            Também conhecido como Home Equity ou CGI, é uma modalidade em que você utiliza um imóvel de sua propriedade como garantia para acessar crédito com condições melhores do que as do mercado tradicional.
          </p>
          <p className="section-sub" style={{ maxWidth: "100%", marginBottom: 24 }}>
            Como o risco da operação é menor, as taxas caem drasticamente. E o melhor: você continua usando o imóvel normalmente durante todo o período do contrato.
          </p>
          <p className="section-sub" style={{ maxWidth: "100%", color: "var(--teal)", fontWeight: 600 }}>
            É o seu <strong style={{ color: "var(--teal)" }}>patrimônio</strong> gerando liquidez, sem abrir mão dele.
          </p>
        </div>
      </section>

      {/* VANTAGENS */}
      <section className="vantagens">
        <div className="section-tag">Vantagens</div>
        <h2 className="section-title">
          Por que fazer Empréstimo com Garantia de Imóvel<br />com a <em>AG Antecipa?</em>
        </h2>
        <p className="section-sub">Taxas que respeitam seu patrimônio. Prazo que preserva seu caixa. Uma parceria do início ao fim.</p>

        <div className="vantagens-grid">
          {[
            { icon: "💰", title: "Taxas reduzidas", desc: <>Juros que respeitam o tamanho do seu <strong style={{ color: "var(--teal)" }}>patrimônio</strong>, a partir de 1,09% a.m. + IPCA.</> },
            { icon: "📅", title: "Prazo longo", desc: "Até 240 meses para pagar, sem comprometer seu fluxo de caixa mensal." },
            { icon: "🏦", title: "Crédito de alto valor", desc: "Acesse até 60% do valor do seu imóvel, sem limite mínimo de finalidade." },
            { icon: "🔓", title: "Liberdade total de uso", desc: "Capital de giro, expansão, quitação de dívidas caras. Você decide como usar." },
            { icon: "🏠", title: "O imóvel continua seu", desc: "Você usa o bem como garantia, continua sendo o proprietário e pode utilizá-lo normalmente." },
            { icon: "🤝", title: "Atendimento real, do início ao fim", desc: "Nenhum chatbot. Um especialista dedicado acompanha cada etapa da operação." },
          ].map((v, i) => (
            <div className="vant-card" key={i}>
              <div className="vant-icon">{v.icon}</div>
              <h3>{v.title}</h3>
              <p>{v.desc}</p>
            </div>
          ))}
          <div className="vant-card vant-highlight">
            <div className="vant-icon" style={{ flexShrink: 0 }}>⭐</div>
            <p><strong style={{ color: "var(--teal)" }}>Na AG Antecipa, crédito que começa com quem entende o outro lado.</strong></p>
          </div>
        </div>

        <div className="section-cta">
          <button className="btn-primary" onClick={scrollToForm}>Quero simular meu crédito</button>
          <span style={{ fontSize: 13, color: "var(--gray)" }}>Análise gratuita e sem compromisso</span>
        </div>
      </section>

      {/* COMPARATIVO */}
      <section className="compare">
        <div className="section-tag">Comparativo</div>
        <h2 className="section-title">
          Compare antes de decidir.<br /><em>Os números falam por si.</em>
        </h2>
        <p className="section-sub">Veja como o Empréstimo com Garantia de Imóvel com a AG Antecipa se compara às alternativas mais usadas no mercado.</p>

        <div className="chart-wrapper">
          <div className="chart-area">
            <div className="chart-bars" ref={chartRef}>
              <div className="bar-group featured-bar">
                <div className="bar-col">
                  <div className={`bar-fill bar-ag ${barsAnimated ? "animated" : ""}`} style={{ "--target-h": "8%" } as React.CSSProperties}></div>
                </div>
                <div className="bar-label-bottom">
                  <span className="bar-rate-top teal-rate"><span style={{ fontSize: '0.55em', opacity: 0.7, display: 'block', marginBottom: 1, fontWeight: 400 }}>A partir de</span>1,09% a.m.<br /><span style={{ fontSize: 12, fontWeight: 500 }}>+ IPCA</span></span>
                  <span className="bar-name">Empréstimo com<br />Garantia de Imóvel</span>
                  <span className="bar-brand">AG Antecipa</span>
                </div>
              </div>
              <div className="bar-group">
                <div className="bar-col">
                  <div className={`bar-fill bar-pessoal ${barsAnimated ? "animated" : ""}`} style={{ "--target-h": "43%", transitionDelay: "0.12s" } as React.CSSProperties}></div>
                </div>
                <div className="bar-label-bottom">
                  <span className="bar-rate-top">~6,10% a.m.</span>
                  <span className="bar-name">Empréstimo<br />Pessoal</span>
                </div>
              </div>
              <div className="bar-group">
                <div className="bar-col">
                  <div className={`bar-fill bar-cheque ${barsAnimated ? "animated" : ""}`} style={{ "--target-h": "56%", transitionDelay: "0.24s" } as React.CSSProperties}></div>
                </div>
                <div className="bar-label-bottom">
                  <span className="bar-rate-top">~8,00% a.m.</span>
                  <span className="bar-name">Cheque<br />Especial</span>
                </div>
              </div>
              <div className="bar-group">
                <div className="bar-col">
                  <div className={`bar-fill bar-cartao ${barsAnimated ? "animated" : ""}`} style={{ "--target-h": "100%", transitionDelay: "0.36s" } as React.CSSProperties}></div>
                </div>
                <div className="bar-label-bottom">
                  <span className="bar-rate-top">~14,20% a.m.</span>
                  <span className="bar-name">Cartão<br />Rotativo</span>
                </div>
              </div>
            </div>
            <div className="chart-source">Fonte: Banco Central do Brasil</div>
          </div>

          <div className="chart-insight-col">
            <div className="insight-card">
              <div className="insight-stat">13x</div>
              <p className="insight-text">O cartão rotativo pode custar <strong>mais de 13 vezes</strong> o que você pagaria com o Empréstimo com Garantia de Imóvel na AG Antecipa.</p>
            </div>
            <div className="insight-card insight-card-alt">
              <div className="insight-icon">💡</div>
              <p className="insight-text">Enquanto outros produtos corroem sua margem, o crédito com garantia preserva o caixa e ainda te dá fôlego para crescer.</p>
            </div>
            <div className="compare-cta-inline">
              <p>Não existe motivo para pagar mais caro por crédito quando você tem um imóvel. Com a AG Antecipa, você descobre em minutos quanto pode acessar.</p>
              <button className="btn-primary" onClick={scrollToForm}>Simular gratuitamente</button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="faq">
        <div className="section-tag">Dúvidas frequentes</div>
        <h2 className="section-title">
          Perguntas importantes antes<br />de <em>contratar</em>
        </h2>

        <div className="faq-grid">
          {FAQ_DATA.map((item, i) => (
            <div
              key={i}
              className={`faq-item ${openFaq === i ? "open" : ""}`}
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
            >
              <div className="faq-q">
                <span>{item.q}</span>
                <span className="arrow">+</span>
              </div>
              <div className="faq-a">{item.a}</div>
            </div>
          ))}
        </div>

      </section>

      {/* CTA FINAL */}
      <section className="cta-final" style={{ backgroundImage: `url(${ctaBgImage})`, backgroundSize: '120%', backgroundPosition: '-5% top', backgroundRepeat: 'no-repeat', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(10, 18, 30, 0.82)', zIndex: 0 }} />
        <div className="section-tag" style={{ position: 'relative', zIndex: 1 }}>Comece agora</div>
        <h2 className="section-title" style={{ position: 'relative', zIndex: 1 }}>Seu próximo passo <em>começa aqui.</em></h2>
        <p className="section-sub" style={{ position: 'relative', zIndex: 1 }}>A AG Antecipa oferece crédito com taxa justa, atendimento próximo e sem letras miúdas. Faça sua simulação gratuita agora.</p>
        <div className="cta-btn-group" style={{ justifyContent: 'center', position: 'relative', zIndex: 1 }}>
          <button className="btn-primary" onClick={scrollToForm}>Simular agora</button>
        </div>
        <div className="cta-badges" style={{ position: 'relative', zIndex: 1 }}>
          <div className="cta-badge"><span>✓</span> Análise sem compromisso</div>
          <div className="cta-badge"><span>✓</span> Atendimento exclusivo</div>
          <div className="cta-badge"><span>✓</span> Transparência total</div>
          <div className="cta-badge"><span>✓</span> 21 anos de mercado</div>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer-brand">
          <img src={agLogoWhite} alt="AG Antecipa" className="footer-logo-img" />
          21 anos antecipando recebíveis com atendimento que funciona. Estrutura sólida, promessas cumpridas.
        </div>
        <div className="footer-legal">
          © 2026 AG Antecipa. Todos os direitos reservados.<br />
          Sujeito à análise de crédito.
        </div>
      </footer>

      {showCookieNotice && (
        <div className="cookie-notice" role="status" aria-live="polite">
          <p>Usamos cookies para personalizar conteúdos e melhorar a sua experiência.</p>
          <button className="cookie-notice-btn" onClick={acceptCookies}>Ok, entendi</button>
        </div>
      )}
    </>
  );
};

export default Index;
