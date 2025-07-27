import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0D1B2A] to-[#1A2C42] text-white py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Link to="/contato">
          <Button variant="ghost" className="text-blue-300 mb-6 hover:text-blue-100 -ml-2">
            <ArrowLeft className="mr-2 h-5 w-5" />
            Voltar
          </Button>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300 mb-6">
            Política de Privacidade
          </h1>
          
          <Card className="p-6 shadow-xl bg-gradient-to-br from-[#1A2C42] to-[#15253A] border border-blue-800/50">
            <div className="space-y-6 text-blue-100">
              <section>
                <h2 className="text-xl font-semibold text-blue-300 mb-3">1. Introdução</h2>
                <p className="mb-4 leading-relaxed text-sm md:text-base">
                  A Paulo Cell está comprometida em proteger a privacidade e os dados pessoais dos usuários 
                  que utilizam nossos serviços. Esta Política de Privacidade descreve como coletamos, 
                  utilizamos e protegemos suas informações quando você interage com a nossa assistência 
                  técnica, seja presencialmente ou através de nossos canais digitais.
                </p>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold text-blue-300 mb-3">2. Dados Coletados</h2>
                <p className="mb-2 leading-relaxed text-sm md:text-base">
                  Podemos coletar os seguintes tipos de informações:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-blue-200 text-sm md:text-base">
                  <li>Informações de contato (nome, telefone, e-mail, endereço)</li>
                  <li>Detalhes do dispositivo para reparo (modelo, número de série, problemas)</li>
                  <li>Histórico de serviços prestados</li>
                  <li>Informações de pagamento</li>
                  <li>Dados de uso do site e comunicações com nossa equipe</li>
                </ul>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold text-blue-300 mb-3">3. Uso das Informações</h2>
                <p className="mb-2 leading-relaxed text-sm md:text-base">
                  Utilizamos suas informações para:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-blue-200 text-sm md:text-base">
                  <li>Prestar serviços de assistência técnica</li>
                  <li>Entrar em contato sobre o andamento de reparos</li>
                  <li>Processar pagamentos</li>
                  <li>Enviar notificações sobre ofertas e novos serviços</li>
                  <li>Melhorar nossos serviços e atendimento</li>
                  <li>Cumprir obrigações legais e fiscais</li>
                </ul>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold text-blue-300 mb-3">4. Compartilhamento de Dados</h2>
                <p className="mb-4 leading-relaxed text-sm md:text-base">
                  Não compartilhamos seus dados pessoais com terceiros, exceto quando necessário para a 
                  prestação dos serviços contratados, como parceiros de assistência técnica, 
                  processadores de pagamento, ou quando exigido por lei.
                </p>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold text-blue-300 mb-3">5. Segurança de Dados</h2>
                <p className="mb-4 leading-relaxed text-sm md:text-base">
                  Implementamos medidas de segurança técnicas e organizacionais para proteger seus 
                  dados contra acesso não autorizado, perda ou alteração. No entanto, nenhum sistema 
                  é completamente seguro, e faremos o possível para proteger suas informações.
                </p>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold text-blue-300 mb-3">6. Seus Direitos</h2>
                <p className="mb-2 leading-relaxed text-sm md:text-base">
                  Você tem direito a:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-blue-200 text-sm md:text-base">
                  <li>Acessar os dados que possuímos sobre você</li>
                  <li>Corrigir dados imprecisos ou incompletos</li>
                  <li>Solicitar a exclusão de seus dados</li>
                  <li>Retirar seu consentimento a qualquer momento</li>
                  <li>Solicitar a limitação do tratamento de seus dados</li>
                </ul>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold text-blue-300 mb-3">7. Contato</h2>
                <p className="mb-4 leading-relaxed text-sm md:text-base">
                  Para qualquer dúvida ou solicitação relacionada aos seus dados pessoais, entre em 
                  contato conosco através do e-mail: paullo.celullar2020@gmail.com ou pelo telefone: 
                  (98) 98403-1640.
                </p>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold text-blue-300 mb-3">8. Alterações na Política</h2>
                <p className="mb-4 leading-relaxed text-sm md:text-base">
                  Podemos atualizar esta política ocasionalmente. Recomendamos que a verifique 
                  periodicamente. A versão mais recente desta política estará sempre disponível em 
                  nosso site.
                </p>
                <p className="text-sm text-blue-300">
                  Última atualização: {new Date().toLocaleDateString()}
                </p>
              </section>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default PrivacyPolicy; 