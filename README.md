# Drugstore Project - Frontend

## 📋 Sobre o Projeto
Este é o frontend do sistema **PharmaCare**, uma aplicação web moderna e responsiva para gestão de farmácias. Ele oferece interfaces intuitivas para administradores, farmacêuticos e vendedores realizarem suas tarefas diárias, como vendas no balcão (POS), cadastro de produtos e visualização de relatórios.

O projeto foi desenvolvido focando em **Usabilidade** e **Performance**, utilizando componentes reutilizáveis e uma arquitetura baseada em páginas e componentes do Next.js.

## 🚀 Tecnologias Utilizadas
- **Framework:** Next.js 14 (App Router)
- **Linguagem:** TypeScript
- **Estilização:** Tailwind CSS
- **Componentes UI:** Shadcn UI
- **Ícones:** Lucide React
- **Testes E2E:** Selenium WebDriver (Python)

## 📂 Funcionalidades Principais
- **Dashboard Administrativo:** Visão geral de vendas, estoque baixo e alertas.
- **Ponto de Venda (POS):** Interface ágil para realizar vendas, adicionar produtos e selecionar clientes.
- **Gestão de Estoque:** Cadastro de produtos, controle de lotes e validade.
- **Gestão de Pedidos:** Solicitação de reposição (Reorder) e recebimento de mercadorias.
- **Controle de Acesso:** Diferentes níveis de permissão (Admin, Seller, Pharmacist).

## 🐳 Pré-requisitos
Certifique-se de que o **Backend** esteja rodando (via Docker ou localmente) para que o Frontend possa consumir a API.

## 🛠️ Como Rodar o Projeto

1. **Navegue até a pasta do frontend:**
   ```bash
   cd Drugstore_Project/Frontend/Frontend
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

4. **Acesse a aplicação:**
   Abra seu navegador em `http://localhost:3000`.

## 🧪 Testes Automatizados (E2E)
O projeto conta com testes ponta-a-ponta (E2E) utilizando Selenium para validar os fluxos críticos do usuário (Login, Venda, Reposição).

Para rodar os testes:
1. Certifique-se de que o Frontend (`localhost:3000`) e o Backend (`localhost:8000`) estejam rodando.
2. Execute o script de teste:
   ```bash
   python selenium_tests/selenium_test.py
   ```