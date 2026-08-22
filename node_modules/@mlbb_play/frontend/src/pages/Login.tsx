export function Login() {
  return (
    <div className="max-w-md mx-auto cyber-card p-8 mt-16">
      <h1 className="text-2xl font-bold text-gradient mb-6 text-center">Нэвтрэх</h1>
      <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
        <input className="cyber-input" placeholder="Хэрэглэгчийн нэр" />
        <input className="cyber-input" type="password" placeholder="Нууц үг" />
        <button className="cyber-button" type="submit">
          Нэвтрэх
        </button>
      </form>
      <p className="text-xs text-gray-500 text-center mt-4">
        Бодит auth-service Phase 2-т нэмэгдэнэ.
      </p>
    </div>
  );
}
