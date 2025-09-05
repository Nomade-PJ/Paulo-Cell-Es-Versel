import { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { useNavigate } from 'react-router-dom';
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  AlertDialog,
  AlertDialogContent, 
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { 
  Lock, 
  Mail, 
  Phone, 
  Github, 
  X, 
  Smartphone, 
  Eye, 
  EyeOff, 
  User, 
  ShieldCheck,
  LinkIcon,
  Building,
  FileText,
  MapPin,
  ArrowRight,
  ArrowLeft,
  CheckCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { validateDocument, formatDocument, validateCEP, formatCEP, fetchCEPInfo, formatPhone, validatePhone } from "@/lib/validators";
import { supabase } from "@/integrations/supabaseClient";

// Schema para validação do formulário de login
const loginSchema = z.object({
  email: z.string().email({ message: "E-mail inválido" }),
  password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres" })
});

// Schema para a primeira etapa do cadastro
const step1Schema = z.object({
  companyName: z.string().min(2, { message: "O nome da empresa deve ter pelo menos 2 caracteres" }),
  email: z.string().email({ message: "E-mail inválido" }),
  password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres" }),
  phone: z.string().min(10, { message: "Telefone inválido" }).refine(validatePhone, {
    message: "Formato de telefone inválido"
  })
});

// Schema para a segunda etapa do cadastro
const step2Schema = z.object({
  document: z.string().min(11, { message: "CPF ou CNPJ é obrigatório" }).refine((doc) => {
    const cleanDoc = doc.replace(/\D/g, '');
    if (cleanDoc.length === 11) {
      return validateDocument(doc, 'cpf');
    } else if (cleanDoc.length === 14) {
      return validateDocument(doc, 'cnpj');
    }
    return false;
  }, {
    message: "CPF ou CNPJ inválido"
  }),
  cep: z.string().min(8, { message: "CEP inválido" }).refine(validateCEP, {
    message: "Formato de CEP inválido"
  }),
  state: z.string().min(2, { message: "Estado é obrigatório" }),
  city: z.string().min(2, { message: "Cidade é obrigatória" }),
  neighborhood: z.string().min(2, { message: "Bairro é obrigatório" }),
  street: z.string().min(2, { message: "Logradouro é obrigatório" }),
  number: z.string().min(1, { message: "Número é obrigatório" }),
  complement: z.string().optional()
});

// Schema para validação do formulário de recuperação de senha
const resetPasswordSchema = z.object({
  email: z.string().email({ message: "E-mail inválido" })
});

// Schema para validação do formulário de link mágico
const magicLinkSchema = z.object({
  email: z.string().email({ message: "E-mail inválido" })
});

type LoginForm = z.infer<typeof loginSchema>;
type Step1Form = z.infer<typeof step1Schema>;
type Step2Form = z.infer<typeof step2Schema>;
type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;
type MagicLinkForm = z.infer<typeof magicLinkSchema>;

const Login = () => {
  const { login, signup, isAuthenticated, sendPasswordResetEmail, sendMagicLink } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminPasswordError, setAdminPasswordError] = useState("");
  const [developerContactOpen, setDeveloperContactOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [animateCard, setAnimateCard] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [magicLinkDialogOpen, setMagicLinkDialogOpen] = useState(false);
  const [signupStep, setSignupStep] = useState(1);
  const [step1Data, setStep1Data] = useState<Step1Form | null>(null);
  const [isLoadingCEP, setIsLoadingCEP] = useState(false);

  // Efeito para animar o card quando o componente montar
  useEffect(() => {
    setAnimateCard(true);
  }, []);

  // Se já estiver autenticado, redirecionar para a página inicial
  if (isAuthenticated) {
    navigate("/dashboard", { replace: true });
    return null;
  }

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  const step1Form = useForm<Step1Form>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      companyName: "",
      email: "",
      password: "",
      phone: ""
    }
  });

  const step2Form = useForm<Step2Form>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      document: "",
      cep: "",
      state: "",
      city: "",
      neighborhood: "",
      street: "",
      number: "",
      complement: ""
    }
  });

  const resetPasswordForm = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: ""
    }
  });

  const magicLinkForm = useForm<MagicLinkForm>({
    resolver: zodResolver(magicLinkSchema),
    defaultValues: {
      email: ""
    }
  });

  const handleLogin = async (values: LoginForm) => {
    setIsLoading(true);
    try {
      await login(values.email, values.password);
      // A navegação será feita automaticamente quando isAuthenticated mudar
    } catch (error: any) {
      console.error(error);
      // Toast já é chamado no login() do AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep1Submit = async (values: Step1Form) => {
    setStep1Data(values);
    setSignupStep(2);
  };

  const handleStep2Submit = async (values: Step2Form) => {
    if (!step1Data) {
      toast.error("Dados da primeira etapa não encontrados");
      setSignupStep(1);
      return;
    }

    setIsLoading(true);
    try {
      // Primeiro, criar a conta no Supabase Auth
      const { data, error } = await supabase.auth.signUp({ 
        email: step1Data.email, 
        password: step1Data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
          data: {
            company_name: step1Data.companyName,
          }
        }
      });

      if (error) throw error;

      // Depois, criar o perfil completo com todos os dados
      if (data?.user) {
        // Detecta automaticamente o tipo de documento
        const cleanDoc = values.document.replace(/\D/g, '');
        const documentType = cleanDoc.length === 11 ? 'cpf' : 'cnpj';
        
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            name: step1Data.companyName, // Nome da empresa
            company_name: step1Data.companyName,
            email: step1Data.email,
            phone: step1Data.phone,
            document_type: documentType,
            document: values.document,
            cep: values.cep,
            state: values.state,
            city: values.city,
            neighborhood: values.neighborhood,
            street: values.street,
            number: values.number,
            complement: values.complement,
            role: 'Usuário',
            registration_step: 2, // Cadastro completo
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (profileError) {
          console.error("Erro ao criar perfil:", profileError);
        }
      }

      toast.success("Cadastro realizado com sucesso! Verifique seu e-mail para confirmar.");
      setActiveTab("login");
      setSignupStep(1);
      step1Form.reset();
      step2Form.reset();
      setStep1Data(null);
    } catch (error: any) {
      console.error("Erro no cadastro:", error);
      toast.error("Falha no cadastro: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCEPChange = async (cep: string) => {
    const formattedCEP = formatCEP(cep);
    step2Form.setValue('cep', formattedCEP);

    if (validateCEP(cep)) {
      setIsLoadingCEP(true);
      try {
        const cepInfo = await fetchCEPInfo(cep);
        if (cepInfo) {
          step2Form.setValue('street', cepInfo.logradouro);
          step2Form.setValue('neighborhood', cepInfo.bairro);
          step2Form.setValue('city', cepInfo.localidade);
          step2Form.setValue('state', cepInfo.uf);
          if (cepInfo.complemento) {
            step2Form.setValue('complement', cepInfo.complemento);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
      } finally {
        setIsLoadingCEP(false);
      }
    }
  };

  const handleDocumentChange = (document: string) => {
    const cleanDoc = document.replace(/\D/g, '');
    let formatted = document;
    let docType: 'cpf' | 'cnpj' = 'cpf';
    
    // Detecta automaticamente se é CPF ou CNPJ baseado no comprimento
    if (cleanDoc.length <= 11) {
      docType = 'cpf';
      formatted = formatDocument(document, 'cpf');
    } else {
      docType = 'cnpj';
      formatted = formatDocument(document, 'cnpj');
    }
    
    step2Form.setValue('document', formatted);
    return docType;
  };

  const handlePhoneChange = (phone: string) => {
    const formatted = formatPhone(phone);
    step1Form.setValue('phone', formatted);
  };

  const handleAdminPassword = () => {
    if (adminPassword === "paulocell@admin1") {
      setActiveTab("signup");
      setAdminDialogOpen(false);
      setAdminPassword("");
      setAdminPasswordError("");
    } else {
      setAdminPasswordError("Senha administrativa incorreta");
    }
  };

  const handleResetPassword = async (values: ResetPasswordForm) => {
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(values.email);
      setResetPasswordDialogOpen(false);
      resetPasswordForm.reset();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicLink = async (values: MagicLinkForm) => {
    setIsLoading(true);
    try {
      await sendMagicLink(values.email);
      setMagicLinkDialogOpen(false);
      magicLinkForm.reset();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center landing-page p-4 bg-gradient-to-b from-slate-900 to-slate-800 relative overflow-hidden login-gradient-bg">
      {/* Background elements for visual interest */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-600 opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/4 -left-20 w-60 h-60 bg-purple-600 opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-60 h-60 bg-cyan-600 opacity-10 rounded-full blur-3xl"></div>
      </div>

      {/* Logo e nome do sistema */}
      <div className={cn(
        "mb-6 flex flex-col items-center transition-all duration-700 transform", 
        animateCard ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-8"
      )}>
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/20 mb-3 icon-container">
          <Smartphone className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Paulo Cell</h1>
        <p className="text-slate-300 mt-1">Sistema de Gerenciamento</p>
      </div>

      <div className={cn(
        "w-full max-w-md transition-all duration-500 transform", 
        animateCard ? "opacity-100 scale-100" : "opacity-0 scale-95"
      )}>
        <Card className="shadow-xl border-none rounded-xl overflow-hidden" 
          style={{ 
            background: 'rgba(15, 23, 42, 0.7)', 
            backdropFilter: 'blur(16px)',
            borderBottom: '1px solid rgba(59, 130, 246, 0.3)'
          }}
        >
          <CardHeader className="space-y-1 text-center pb-6">
            <CardTitle className="text-2xl font-bold text-white">Bem-vindo</CardTitle>
            <CardDescription className="text-slate-300">
              Acesse o sistema para gerenciar sua loja
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-2 mb-6 bg-slate-800/50 p-1 rounded-lg">
                <TabsTrigger 
                  value="login" 
                  className="rounded-md text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white data-[state=active]:shadow-md"
                >
                  Login
                </TabsTrigger>
                <TabsTrigger 
                  value="signup" 
                  disabled={activeTab !== "signup"} 
                  className="rounded-md text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white data-[state=active]:shadow-md"
                >
                  Cadastrar
                </TabsTrigger>
              </TabsList>
              <TabsContent value="login" className="space-y-4">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-200 flex items-center text-sm font-medium">
                            <Mail className="h-4 w-4 mr-2 text-blue-400" />
                            Email
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="seu@email.com" 
                              type="email" 
                              {...field} 
                              className="bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-blue-500 rounded-md h-11"
                            />
                          </FormControl>
                          <FormMessage className="text-red-400 text-xs" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-200 flex items-center text-sm font-medium">
                            <Lock className="h-4 w-4 mr-2 text-blue-400" />
                            Senha
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                type={showPassword ? "text" : "password"} 
                                placeholder="******" 
                                {...field} 
                                className="bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-blue-500 rounded-md pr-10 h-11"
                              />
                              <button 
                                type="button" 
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                              >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage className="text-red-400 text-xs" />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full enter-button h-11 mt-2 font-medium pulse-animation" 
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Entrando...
                        </span>
                      ) : (
                        "Entrar"
                      )}
                    </Button>
                  </form>
                </Form>
                <div className="text-center mt-2 flex flex-col gap-1">
                  <Button 
                    variant="link" 
                    className="text-sm text-blue-400 hover:text-blue-300 hover:underline"
                    onClick={() => setAdminDialogOpen(true)}
                  >
                    Não tem conta? Cadastre-se
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="signup" className="space-y-4">
                {/* Indicador de etapas */}
                <div className="flex items-center justify-center space-x-4 mb-6">
                  <div className={`flex items-center ${signupStep >= 1 ? 'text-blue-400' : 'text-slate-500'}`}>
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                      signupStep >= 1 ? 'border-blue-400 bg-blue-400/20' : 'border-slate-500'
                    }`}>
                      {signupStep > 1 ? <CheckCircle className="h-4 w-4" /> : '1'}
                    </div>
                    <span className="ml-2 text-sm font-medium text-slate-200">Dados Básicos</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-500" />
                  <div className={`flex items-center ${signupStep >= 2 ? 'text-blue-400' : 'text-slate-500'}`}>
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                      signupStep >= 2 ? 'border-blue-400 bg-blue-400/20' : 'border-slate-500'
                    }`}>
                      2
                    </div>
                    <span className="ml-2 text-sm font-medium text-slate-200">Documentos</span>
                  </div>
                </div>

                {signupStep === 1 && (
                  <Form {...step1Form}>
                    <form onSubmit={step1Form.handleSubmit(handleStep1Submit)} className="space-y-4">
                      <FormField
                        control={step1Form.control}
                        name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-200 flex items-center text-sm font-medium">
                            <Building className="h-4 w-4 mr-2 text-blue-400" />
                            Nome da Empresa
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Digite o nome da empresa" 
                              {...field} 
                              className="bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-blue-500 rounded-md h-11"
                            />
                          </FormControl>
                          <FormMessage className="text-red-400 text-xs" />
                        </FormItem>
                      )}
                    />
                      <FormField
                        control={step1Form.control}
                        name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-200 flex items-center text-sm font-medium">
                            <Mail className="h-4 w-4 mr-2 text-blue-400" />
                            Email
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="empresa@email.com" 
                              type="email" 
                              {...field} 
                              className="bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-blue-500 rounded-md h-11"
                            />
                          </FormControl>
                          <FormMessage className="text-red-400 text-xs" />
                        </FormItem>
                      )}
                    />
                      <FormField
                        control={step1Form.control}
                        name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-200 flex items-center text-sm font-medium">
                            <Lock className="h-4 w-4 mr-2 text-blue-400" />
                            Senha
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                type={showPassword ? "text" : "password"} 
                                placeholder="******" 
                                {...field} 
                                className="bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-blue-500 rounded-md pr-10 h-11"
                              />
                              <button 
                                type="button" 
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                              >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage className="text-red-400 text-xs" />
                        </FormItem>
                      )}
                    />
                      <FormField
                        control={step1Form.control}
                        name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-200 flex items-center text-sm font-medium">
                            <Phone className="h-4 w-4 mr-2 text-blue-400" />
                            Telefone
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="(11) 99999-9999" 
                              {...field}
                              onChange={(e) => {
                                handlePhoneChange(e.target.value);
                              }}
                              className="bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-blue-500 rounded-md h-11"
                            />
                          </FormControl>
                          <FormMessage className="text-red-400 text-xs" />
                        </FormItem>
                      )}
                    />
                      <Button 
                        type="submit" 
                        className="w-full enter-button h-11 mt-6 font-medium pulse-animation"
                      >
                        <span className="flex items-center justify-center">
                          Próximo
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </span>
                      </Button>
                    </form>
                  </Form>
                )}

                {signupStep === 2 && (
                  <Form {...step2Form}>
                    <form onSubmit={step2Form.handleSubmit(handleStep2Submit)} className="space-y-4">
                      <FormField
                        control={step2Form.control}
                        name="document"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-200 flex items-center text-sm font-medium">
                              <FileText className="h-4 w-4 mr-2 text-blue-400" />
                              CPF ou CNPJ
                            </FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="000.000.000-00 ou 00.000.000/0000-00"
                                {...field}
                                onChange={(e) => {
                                  handleDocumentChange(e.target.value);
                                }}
                                className="bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-blue-500 rounded-md h-11"
                              />
                            </FormControl>
                            <FormMessage className="text-red-400 text-xs" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={step2Form.control}
                        name="cep"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-200 flex items-center text-sm font-medium">
                              <MapPin className="h-4 w-4 mr-2 text-blue-400" />
                              CEP
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  placeholder="00000-000"
                                  {...field}
                                  onChange={(e) => handleCEPChange(e.target.value)}
                                  className="bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-blue-500 rounded-md h-11"
                                />
                                {isLoadingCEP && (
                                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <div className="animate-spin h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full"></div>
                                  </div>
                                )}
                              </div>
                            </FormControl>
                            <FormMessage className="text-red-400 text-xs" />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={step2Form.control}
                          name="state"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-200 text-sm font-medium">
                                Estado
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="UF"
                                  {...field}
                                  className="bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-blue-500 rounded-md h-11"
                                />
                              </FormControl>
                              <FormMessage className="text-red-400 text-xs" />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={step2Form.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-200 text-sm font-medium">
                                Cidade
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Cidade"
                                  {...field}
                                  className="bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-blue-500 rounded-md h-11"
                                />
                              </FormControl>
                              <FormMessage className="text-red-400 text-xs" />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={step2Form.control}
                        name="neighborhood"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-200 text-sm font-medium">
                              Bairro
                            </FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Bairro"
                                {...field}
                                className="bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-blue-500 rounded-md h-11"
                              />
                            </FormControl>
                            <FormMessage className="text-red-400 text-xs" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={step2Form.control}
                        name="street"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-200 text-sm font-medium">
                              Logradouro
                            </FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Rua, Avenida, etc."
                                {...field}
                                className="bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-blue-500 rounded-md h-11"
                              />
                            </FormControl>
                            <FormMessage className="text-red-400 text-xs" />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={step2Form.control}
                          name="number"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-200 text-sm font-medium">
                                Número
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="123"
                                  {...field}
                                  className="bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-blue-500 rounded-md h-11"
                                />
                              </FormControl>
                              <FormMessage className="text-red-400 text-xs" />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={step2Form.control}
                          name="complement"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-200 text-sm font-medium">
                                Complemento
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Apto, Sala..."
                                  {...field}
                                  className="bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-blue-500 rounded-md h-11"
                                />
                              </FormControl>
                              <FormMessage className="text-red-400 text-xs" />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex gap-3 mt-6">
                        <Button 
                          type="button"
                          variant="outline"
                          onClick={() => setSignupStep(1)}
                          className="flex-1 border-slate-700 text-slate-200 hover:bg-slate-800 h-11"
                        >
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          Voltar
                        </Button>
                        <Button 
                          type="submit" 
                          className="flex-1 enter-button h-11 font-medium pulse-animation"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <span className="flex items-center justify-center">
                              <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Cadastrando...
                            </span>
                          ) : (
                            "Cadastrar-se"
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                )}
                <div className="flex justify-center items-center gap-2 text-sm text-slate-400">
                  <Button 
                    variant="link" 
                    className="text-sm text-blue-400 hover:text-blue-300 hover:underline p-0 h-auto"
                    onClick={() => setResetPasswordDialogOpen(true)}
                  >
                    Esqueceu a senha?
                  </Button>
                  <span>•</span>
                  <Button 
                    variant="link" 
                    className="text-sm text-blue-400 hover:text-blue-300 hover:underline p-0 h-auto"
                    onClick={() => setMagicLinkDialogOpen(true)}
                  >
                    Login com link mágico
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-slate-700/50 pt-6 pb-4">
            <p className="text-sm text-slate-400">
              Sistema Desenvolvido por{" "}
              <button 
                onClick={() => setDeveloperContactOpen(true)}
                className="text-blue-400 hover:underline focus:outline-none inline-flex items-center"
              >
                Nomade-PJ <Github className="h-3 w-3 ml-1 inline-block" />
              </button>{" "}
              © 2025
            </p>
          </CardFooter>
        </Card>
      </div>

      {/* Admin Password Dialog */}
      <AlertDialog open={adminDialogOpen} onOpenChange={setAdminDialogOpen}>
        <AlertDialogContent 
          style={{ 
            background: 'rgba(15, 23, 42, 0.95)', 
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(59, 130, 246, 0.3)'
          }} 
          className="border-slate-700/50 rounded-xl shadow-2xl max-w-md"
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-white">
              <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <Lock className="h-4 w-4 text-yellow-400" />
              </div>
              Área Administrativa
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300 mt-2">
              Insira a senha administrativa para acessar o cadastro de usuários
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <div className="relative">
              <Input 
                type="password"
                placeholder="Senha administrativa"
                value={adminPassword}
                onChange={(e) => {
                  setAdminPassword(e.target.value);
                  setAdminPasswordError("");
                }}
                className="bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-blue-500 rounded-md h-11 pr-10"
              />
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            </div>
            {adminPasswordError && (
              <p className="text-sm text-red-400 mt-2 flex items-center">
                <X className="h-4 w-4 mr-1" />
                {adminPasswordError}
              </p>
            )}
          </div>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
            <AlertDialogCancel 
              onClick={() => {
                setAdminPassword("");
                setAdminPasswordError("");
              }}
              className="bg-slate-800 text-slate-200 hover:bg-slate-700 border-slate-700 hover:text-white rounded-md sm:w-auto w-full order-2 sm:order-1"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleAdminPassword} 
              className="enter-button sm:w-auto w-full order-1 sm:order-2"
            >
              Continuar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Developer Contact Dialog */}
      <Dialog open={developerContactOpen} onOpenChange={setDeveloperContactOpen}>
        <DialogContent 
          className="sm:max-w-md rounded-xl overflow-hidden"
          style={{ 
            background: 'rgba(15, 23, 42, 0.95)', 
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(59, 130, 246, 0.3)'
          }}
        >
          <DialogHeader className="border-b border-slate-700/50 pb-4">
            <DialogTitle className="text-xl text-white flex items-center">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center mr-2">
                <User className="h-4 w-4 text-blue-400" />
              </div>
              Contato com o Desenvolvedor
            </DialogTitle>
            <DialogDescription className="text-slate-300 mt-2">
              Entre em contato com o desenvolvedor do projeto.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-4">
            <a 
              href="mailto:josecarlosdev24h@gmail.com" 
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800/70 transition-colors group"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="bg-blue-500/20 p-2 rounded-full icon-container transition-all group-hover:bg-blue-500/30">
                <Mail className="h-5 w-5 text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">Email</p>
                <p className="text-sm text-slate-300">josecarlosdev24h@gmail.com</p>
              </div>
            </a>
            
            <a 
              href="https://wa.me/5598992022352" 
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800/70 transition-colors group"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="bg-green-500/20 p-2 rounded-full icon-container transition-all group-hover:bg-green-500/30">
                <Phone className="h-5 w-5 text-green-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">WhatsApp</p>
                <p className="text-sm text-slate-300">(98) 99202-2352</p>
              </div>
            </a>
            
            <a 
              href="https://github.com/Nomade-PJ" 
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800/70 transition-colors group"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="bg-purple-500/20 p-2 rounded-full icon-container transition-all group-hover:bg-purple-500/30">
                <Github className="h-5 w-5 text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">GitHub</p>
                <p className="text-sm text-slate-300">Nomade-PJ</p>
              </div>
            </a>
          </div>
          
          <div className="pt-2 text-center text-xs text-slate-400">
            ©Todos os direitos reservados - NomadePJ/Jose Carlos
          </div>
          
          <div className="mt-4 flex justify-center">
            <Button 
              className="enter-button px-8 py-2"
              onClick={() => setDeveloperContactOpen(false)}
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Password Reset Dialog */}
      <Dialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
        <DialogContent 
          className="sm:max-w-md rounded-xl overflow-hidden"
          style={{ 
            background: 'rgba(15, 23, 42, 0.95)', 
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(59, 130, 246, 0.3)'
          }}
        >
          <DialogHeader className="border-b border-slate-700/50 pb-4">
            <DialogTitle className="text-xl text-white flex items-center">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center mr-2">
                <Lock className="h-4 w-4 text-blue-400" />
              </div>
              Recuperar Senha
            </DialogTitle>
            <DialogDescription className="text-slate-300 mt-2">
              Digite seu e-mail para receber um link de recuperação de senha.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Form {...resetPasswordForm}>
              <form onSubmit={resetPasswordForm.handleSubmit(handleResetPassword)} className="space-y-4">
                <FormField
                  control={resetPasswordForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200 flex items-center text-sm font-medium">
                        <Mail className="h-4 w-4 mr-2 text-blue-400" />
                        Email
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="seu@email.com" 
                          type="email" 
                          {...field} 
                          className="bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-blue-500 rounded-md h-11"
                        />
                      </FormControl>
                      <FormMessage className="text-red-400 text-xs" />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <DialogClose asChild>
                    <Button 
                      type="button" 
                      variant="outline"
                      className="bg-slate-800 text-slate-200 hover:bg-slate-700 border-slate-700 hover:text-white rounded-md"
                    >
                      Cancelar
                    </Button>
                  </DialogClose>
                  <Button 
                    type="submit" 
                    className="enter-button" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Enviando...
                      </span>
                    ) : (
                      "Enviar Link"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Magic Link Dialog */}
      <Dialog open={magicLinkDialogOpen} onOpenChange={setMagicLinkDialogOpen}>
        <DialogContent 
          className="sm:max-w-md rounded-xl overflow-hidden"
          style={{ 
            background: 'rgba(15, 23, 42, 0.95)', 
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(59, 130, 246, 0.3)'
          }}
        >
          <DialogHeader className="border-b border-slate-700/50 pb-4">
            <DialogTitle className="text-xl text-white flex items-center">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center mr-2">
                <LinkIcon className="h-4 w-4 text-purple-400" />
              </div>
              Link Mágico de Acesso
            </DialogTitle>
            <DialogDescription className="text-slate-300 mt-2">
              Receba um link por e-mail para acessar o sistema sem senha.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Form {...magicLinkForm}>
              <form onSubmit={magicLinkForm.handleSubmit(handleMagicLink)} className="space-y-4">
                <FormField
                  control={magicLinkForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200 flex items-center text-sm font-medium">
                        <Mail className="h-4 w-4 mr-2 text-purple-400" />
                        Email
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="seu@email.com" 
                          type="email" 
                          {...field} 
                          className="bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-purple-500 rounded-md h-11"
                        />
                      </FormControl>
                      <FormMessage className="text-red-400 text-xs" />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <DialogClose asChild>
                    <Button 
                      type="button" 
                      variant="outline"
                      className="bg-slate-800 text-slate-200 hover:bg-slate-700 border-slate-700 hover:text-white rounded-md"
                    >
                      Cancelar
                    </Button>
                  </DialogClose>
                  <Button 
                    type="submit" 
                    className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-md" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Enviando...
                      </span>
                    ) : (
                      "Enviar Link Mágico"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Login;
