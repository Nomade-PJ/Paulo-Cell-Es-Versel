import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, LinkIcon, XCircle } from "lucide-react";

export default function MagicLink() {
  const [searchParams] = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Obter o token da URL
  const token = searchParams.get("token") || "";
  const type = searchParams.get("type") || "";
  
  useEffect(() => {
    const verifyMagicLink = async () => {
      if (!token || type !== "magiclink") {
        setError("Link inválido ou expirado. Por favor, solicite um novo link mágico.");
        setIsProcessing(false);
        return;
      }

      try {
        // Quando o usuário acessa esta página através do link mágico,
        // o Supabase já processa o token automaticamente.
        // Apenas verificamos a sessão e redirecionamos se estiver tudo certo.
        const { data, error } = await supabase.auth.getSession();

        if (error) throw error;

        if (data.session) {
          // Se a sessão existe, redirecionar para o dashboard
          setTimeout(() => {
            navigate("/dashboard");
          }, 1500);
        } else {
          throw new Error("Não foi possível estabelecer uma sessão. Por favor, tente novamente.");
        }
      } catch (err: any) {
        console.error("Erro ao processar link mágico:", err);
        setError(err.message || "Erro ao processar o link mágico. Por favor, tente novamente.");
      } finally {
        setIsProcessing(false);
      }
    };

    verifyMagicLink();
  }, [token, type, navigate]);

  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold tracking-tight">Acessando o Sistema</CardTitle>
            <CardDescription>Estamos validando seu acesso, por favor aguarde...</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-2xl font-bold tracking-tight">Erro ao acessar</CardTitle>
            <CardDescription className="text-red-500">{error}</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button variant="outline" onClick={() => navigate("/login")}>
              Voltar para o login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <LinkIcon className="h-12 w-12 text-primary mx-auto mb-4" />
          <CardTitle className="text-2xl font-bold tracking-tight">Acesso Autorizado!</CardTitle>
          <CardDescription>
            Seu acesso foi autorizado. Você será redirecionado em instantes...
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    </div>
  );
} 