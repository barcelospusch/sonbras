"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";
import {
  ArrowRightIcon,
  GoogleLogoIcon,
  PlanetIcon,
} from "@phosphor-icons/react";
import { auth } from "@/lib/firebase";
import { useApp } from "@/components/app-provider";
import { Shell } from "@/components/shell";
import { SkyArt } from "@/components/sky-art";
export default function Login() {
  const { configured, user } = useApp();
  const router = useRouter();
  const [register, setRegister] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [email, setEmail] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!auth) return;
    const data = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      if (register) {
        const result = await createUserWithEmailAndPassword(
          auth,
          email,
          String(data.get("password")),
        );
        await updateProfile(result.user, {
          displayName: String(data.get("name")).trim(),
        });
      } else
        await signInWithEmailAndPassword(
          auth,
          email,
          String(data.get("password")),
        );
      router.push("/");
    } catch (e) {
      setError(authError(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Shell>
      <div className="auth-layout">
        <div className="auth-story">
          <span className="eyebrow">SEU PONTO DE PARTIDA</span>
          <h1>
            Há muito para descobrir.
            <br />
            <span className="muted">Comece pelo seu céu.</span>
          </h1>
          <SkyArt />
          <p>
            Guarde seus sítios de observação e planeje seu próximo encontro com
            uma ocultação estelar.
          </p>
        </div>
        <section className="auth-card">
          <PlanetIcon size={35} weight="duotone" className="accent" />
          <h2>
            {user
              ? "Você já está conectado"
              : register
                ? "Crie sua conta"
                : "Bom ter você por aqui"}
          </h2>
          <p className="muted">
            {register
              ? "Seu observatório pessoal começa aqui."
              : "Entre para acessar seus sítios de observação."}
          </p>
          {!configured ? (
            <div className="notice">
              <h3>Conecte seu projeto Firebase</h3>
              <p>
                Preencha as variáveis de <code>.env.local</code> conforme{" "}
                <code>.env.example</code>, habilite os provedores de
                autenticação e publique as regras do Firestore. As instruções
                estão no README do projeto.
              </p>
            </div>
          ) : user ? (
            <Link href="/" className="button">
              Ir para meus sítios <ArrowRightIcon size={18} />
            </Link>
          ) : (
            <>
              <button
                className="button secondary full"
                disabled={busy}
                onClick={async () => {
                  if (!auth) return;
                  setBusy(true);
                  setError("");
                  try {
                    await signInWithPopup(auth, new GoogleAuthProvider());
                    router.push("/");
                  } catch (e) {
                    setError(authError(e));
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <GoogleLogoIcon weight="duotone" size={20} /> Continuar com
                Google
              </button>
              <div className="divider">ou entre com seu e-mail</div>
              <form onSubmit={submit}>
                {register && (
                  <label>
                    Seu nome
                    <input
                      name="name"
                      required
                      maxLength={100}
                      autoComplete="name"
                    />
                  </label>
                )}
                <label>
                  E-mail
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>
                <label>
                  Senha
                  <input
                    type="password"
                    name="password"
                    minLength={6}
                    required
                    autoComplete={
                      register ? "new-password" : "current-password"
                    }
                  />
                </label>
                {!register && (
                  <button
                    type="button"
                    className="text-link reset-link"
                    disabled={busy}
                    onClick={async () => {
                      if (!auth || !email) {
                        setError("Informe seu e-mail para recuperar a senha.");
                        return;
                      }
                      setBusy(true);
                      setError("");
                      try {
                        await sendPasswordResetEmail(auth, email);
                        setNotice(
                          "Se houver uma conta para este e-mail, você receberá um link para redefinir a senha.",
                        );
                      } catch (e) {
                        setError(authError(e));
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    Esqueci minha senha
                  </button>
                )}
                <button className="button full" disabled={busy}>
                  {busy ? "Aguarde…" : register ? "Criar conta" : "Entrar"}
                  <ArrowRightIcon size={18} />
                </button>
              </form>
              <p className="auth-switch">
                {register ? "Já tem uma conta?" : "Primeira vez por aqui?"}{" "}
                <button
                  className="text-link"
                  onClick={() => {
                    setRegister(!register);
                    setError("");
                    setNotice("");
                  }}
                >
                  {register ? "Entrar" : "Criar conta"}
                </button>
              </p>
            </>
          )}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          {notice && (
            <p className="notice" role="status">
              {notice}
            </p>
          )}
        </section>
      </div>
    </Shell>
  );
}
function authError(error: unknown) {
  const code = (error as { code?: string }).code;
  const messages: Record<string, string> = {
    "auth/invalid-credential": "E-mail ou senha incorretos.",
    "auth/email-already-in-use": "Este e-mail já possui uma conta.",
    "auth/weak-password": "Use uma senha com pelo menos 6 caracteres.",
    "auth/popup-closed-by-user": "O acesso com Google foi cancelado.",
    "auth/popup-blocked":
      "Permita a janela de acesso com Google no seu navegador.",
    "auth/too-many-requests":
      "Muitas tentativas. Aguarde antes de tentar novamente.",
    "auth/unauthorized-domain":
      "Autorize este domínio no Firebase Authentication.",
    "auth/operation-not-allowed":
      "Habilite este provedor no Firebase Authentication.",
    "auth/network-request-failed": "Verifique sua conexão e tente novamente.",
  };
  return (
    messages[code || ""] ||
    "Não foi possível acessar sua conta. Tente novamente."
  );
}
