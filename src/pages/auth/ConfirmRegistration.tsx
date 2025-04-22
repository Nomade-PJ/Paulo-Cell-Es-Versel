import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export default function ConfirmRegistration() {
  const [searchParams] = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract token from URL - handles both search params and hash params
  const getTokenFromUrl = () => {
    // Check for token in search params
    const tokenFromSearch = searchParams.get("token");
    if (tokenFromSearch) return tokenFromSearch;
    
    // Check for token in hash (Supabase sometimes puts it in hash)
    if (location.hash) {
      const hashParams = new URLSearchParams(location.hash.substring(1));
      return hashParams.get("token");
    }
    
    return null;
  };

  useEffect(() => {
    const token = getTokenFromUrl();
    const type = searchParams.get("type");
    
    const verifySignup = async () => {
      try {
        // Verificar sessão diretamente
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        if (data.session) {
          setIsSuccess(true);
        } else {
          // Se não tem sessão, verificar os parâmetros da URL
          if (!token) {
            throw new Error("Link inválido ou expirado. Por favor, solicite um novo convite.");
          }
          
          // Ainda não temos sessão, mas temos um token - pode ser um erro temporário
          throw new Error("Não foi possível confirmar seu registro. Por favor, tente novamente.");
        }
      } catch (err: any) {
        console.error("Erro ao verificar registro:", err);
        setError(err.message || "Erro ao confirmar o registro. Por favor, tente novamente.");
      } finally {
        setIsVerifying(false);
      }
    };
    
    verifySignup();
  }, [searchParams, location.hash]);
  
  // Redirecionar para login após alguns segundos se tudo der certo
  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        navigate("/login");
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [isSuccess, navigate]);
  
  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold tracking-tight">Verificando</CardTitle>
            <CardDescription>Estamos confirmando seu registro...</CardDescription>
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
            <CardTitle className="text-2xl font-bold tracking-tight">Ocorreu um erro</CardTitle>
            <CardDescription className="text-red-500">{error}</CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button variant="outline" onClick={() => navigate("/login")}>
              Voltar para o login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <CardTitle className="text-2xl font-bold tracking-tight">Cadastro Confirmado!</CardTitle>
          <CardDescription>
            Parabéns! Sua inscrição no sistema Paulo Cell foi confirmada com sucesso.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-2">Você já pode acessar o sistema usando seu e-mail e senha.</p>
          <p>Você será redirecionado para a página de login em instantes...</p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={() => navigate("/login")}>
            Ir para o login
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 
