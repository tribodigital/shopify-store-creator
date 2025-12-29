'use client';

import { useState } from 'react';

export default function Home() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleCreateStore = async () => {
    if (!email || !email.includes('@')) {
      alert('Por favor, insira um email válido');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/create-store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-700 to-green-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-green-900 mb-2">
            🏪 Ecom Store Creator
          </h1>
          <p className="text-gray-600">
            Crie sua loja Shopify em segundos
          </p>
          <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
            ✨ Preço Promocional Exclusivo
          </span>
        </div>

        {!result ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500 transition text-gray-900"
              />
            </div>

            <button
              onClick={handleCreateStore}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Criando...</span>
                </>
              ) : (
                <>
                  <span>🚀</span>
                  <span>Criar Loja Shopify</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div>
            {result.error ? (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                <p className="text-red-600 font-semibold mb-2">❌ Erro</p>
                <p className="text-red-700 text-sm">{result.error}</p>
              </div>
            ) : (
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                <p className="text-green-700 font-bold mb-4 text-lg">✅ Loja Criada com Sucesso!</p>
                <div className="space-y-3 text-sm">
                  <div className="bg-white rounded p-3">
                    <p className="text-gray-500 text-xs font-semibold uppercase mb-1">Email</p>
                    <p className="text-gray-900 font-mono">{result.email}</p>
                  </div>
                  <div className="bg-white rounded p-3">
                    <p className="text-gray-500 text-xs font-semibold uppercase mb-1">Senha</p>
                    <p className="text-gray-900 font-mono break-all">{result.password}</p>
                  </div>
                  <div className="bg-white rounded p-3">
                    <p className="text-gray-500 text-xs font-semibold uppercase mb-1">URL da Loja</p>
                    <p className="text-gray-900 font-mono text-xs break-all">{result.storeUrl}</p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => {
                setResult(null);
                setEmail('');
              }}
              className="w-full mt-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 rounded-lg transition"
            >
              ← Criar Outra Loja
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
