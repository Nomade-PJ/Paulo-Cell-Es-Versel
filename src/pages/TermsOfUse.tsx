import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const TermsOfUse = () => {
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
            Termos de Uso
          </h1>
          
          <Card className="p-6 shadow-xl bg-gradient-to-br from-[#1A2C42] to-[#15253A] border border-blue-800/50">
            <div className="space-y-6 text-blue-100">
              <section>
                <h2 className="text-xl font-semibold text-blue-300 mb-3">1. Aceitação dos Termos</h2>
                <p className="mb-4 leading-relaxed text-sm md:text-base">
                  Ao utilizar os serviços da Paulo Cell, você concorda com estes Termos de Uso.
                  Se você não concordar com qualquer parte destes termos, por favor, não utilize
                  nossos serviços ou acesse nosso site.
                </p>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold text-blue-300 mb-3">2. Descrição dos Serviços</h2>
                <p className="mb-4 leading-relaxed text-sm md:text-base">
                  A Paulo Cell oferece serviços de assistência técnica especializada em smartphones, tablets
                  e outros dispositivos eletrônicos, incluindo mas não se limitando a: reparos de hardware,
                  recuperação de dados, substituição de componentes, configuração de software e diagnóstico
                  de problemas.
                </p>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold text-blue-300 mb-3">3. Orçamentos e Pagamentos</h2>
                <p className="mb-4 leading-relaxed text-sm md:text-base">
                  Todos os serviços são precedidos de orçamento, que poderá ser gratuito ou cobrado
                  conforme a complexidade do diagnóstico necessário. O valor do diagnóstico, quando cobrado,
                  poderá ser abatido do valor final do serviço, caso o cliente aprove o orçamento.
                </p>
                <p className="mb-4 leading-relaxed text-sm md:text-base">
                  Os preços dos serviços poderão ser alterados a qualquer momento, mas as alterações
                  não afetarão orçamentos já aprovados pelo cliente. O pagamento poderá ser feito através
                  dos meios disponibilizados pela empresa e informados no momento da contratação.
                </p>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold text-blue-300 mb-3">4. Garantia dos Serviços</h2>
                <p className="mb-4 leading-relaxed text-sm md:text-base">
                  Todos os serviços prestados pela Paulo Cell possuem garantia de 90 dias, contados a
                  partir da data de entrega do dispositivo ao cliente. A garantia cobre exclusivamente
                  os serviços e peças substituídas pela Paulo Cell, e não se aplica nos seguintes casos:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-blue-200 text-sm md:text-base">
                  <li>Danos causados por mau uso, quedas ou acidentes após a entrega</li>
                  <li>Contato com líquidos ou umidade excessiva</li>
                  <li>Tentativas de reparo por terceiros não autorizados</li>
                  <li>Problemas não relacionados ao serviço prestado originalmente</li>
                  <li>Violação dos selos de garantia</li>
                </ul>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold text-blue-300 mb-3">5. Prazo para Retirada</h2>
                <p className="mb-4 leading-relaxed text-sm md:text-base">
                  Os dispositivos devem ser retirados pelo cliente em até 30 dias após a comunicação
                  da conclusão do serviço. Após este prazo, será cobrada uma taxa de armazenamento diária,
                  conforme informado na loja. Após 90 dias sem retirada, a Paulo Cell poderá dispor do
                  aparelho para ressarcimento de seus custos, conforme previsto em lei.
                </p>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold text-blue-300 mb-3">6. Responsabilidades</h2>
                <p className="mb-4 leading-relaxed text-sm md:text-base">
                  A Paulo Cell compromete-se a realizar os serviços com o máximo de diligência e qualidade
                  técnica. No entanto, não se responsabiliza por dados armazenados nos dispositivos, sendo
                  responsabilidade do cliente realizar o backup de suas informações antes de entregar o 
                  equipamento para reparo.
                </p>
                <p className="mb-4 leading-relaxed text-sm md:text-base">
                  Em caso de dispositivos com senhas ou bloqueios, o cliente deverá fornecê-los no momento
                  da entrega do aparelho para reparo, caso contrário, alguns serviços poderão ser
                  impossibilitados de serem realizados.
                </p>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold text-blue-300 mb-3">7. Propriedade Intelectual</h2>
                <p className="mb-4 leading-relaxed text-sm md:text-base">
                  Todo o conteúdo apresentado em nosso site, incluindo textos, gráficos, logotipos, ícones,
                  imagens, áudios e software, são propriedade da Paulo Cell ou de seus fornecedores e
                  estão protegidos pelas leis de propriedade intelectual aplicáveis.
                </p>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold text-blue-300 mb-3">8. Alterações nos Termos</h2>
                <p className="mb-4 leading-relaxed text-sm md:text-base">
                  A Paulo Cell reserva-se o direito de modificar estes termos a qualquer momento.
                  As alterações entrarão em vigor imediatamente após sua publicação no site.
                  O uso continuado dos serviços após tais modificações constitui aceitação dos novos termos.
                </p>
                <p className="text-sm text-blue-300">
                  Última atualização: {new Date().toLocaleDateString()}
                </p>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold text-blue-300 mb-3">9. Contato</h2>
                <p className="mb-4 leading-relaxed text-sm md:text-base">
                  Para dúvidas ou esclarecimentos sobre estes termos, entre em contato conosco através
                  do e-mail: paullo.celullar2020@gmail.com ou pelo telefone: (98) 98403-1640.
                </p>
              </section>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default TermsOfUse; 