# 3DCost 📐🏷️

> **Sistema Completo de Engenharia de Custos e Formação de Preço de Venda para Impressão 3D**  
> Fiel 100% à metodologia matemática da planilha de referência, com interface moderna **Stripe Clean** (sem luzes neon, foco em clareza analítica executiva, DRE completo, proposta comercial A4 para PDF e envio via WhatsApp).

---

## 🚀 Principais Funcionalidades

1. **Calculadora & Orçador Completo:**
   - **Múltiplas Peças / Mesas no mesmo orçamento:** cada item com peso (g), tempo (dias, horas, minutos), seleção de impressora e filamento/resina.
   - **Mão de Obra e Atividades Operacionais:** fatiamento CAD, preparação de mesa, troca de filamento, pós-processamento, embalagem e expedição.
   - **Fórmula Real de Risco de Falha:** cálculo por divisor de reposição (`Subtotal / (1 - %falha) - Subtotal`), cobrindo tanto material perdido quanto tempo de máquina consumido.
   - **DRE Analítico Instantâneo:** custos diretos, indiretos de oficina, depreciação, impostos e margem líquida de lucro.
   - **Envio Direto para WhatsApp:** mensagem formatada com detalhamento do pedido e valores.
   - **Proposta Comercial A4:** layout pronto para impressão em PDF (`window.print()`) sem poluição visual.

2. **Gestão de Impressoras (Ativos Produtivos):**
   - Cálculo automático do custo por hora de depreciação:  
     $$\text{Custo/Hora} = \frac{\text{Preço de Aquisição} + \text{Manutenção Estimada}}{\text{Vida Útil em Horas}}$$
   - Potência nominal em kW e consumo elétrico por hora de impressão.

3. **Catálogo de Filamentos e Resinas:**
   - Cadastro de bobinas com peso (kg) e custo por bobina, com conversão automática para custo por grama / kg.
   - Suporte a PLA, PETG, ABS, TPU, Resina UV, etc.

4. **Configuração da Oficina & Taxa Horária de Mão de Obra:**
   - Despesas mensais fixas (energia geral, internet, licenças CAD, MEI/DAS).
   - Depreciação de equipamentos periféricos (computador, monitores, bancadas, ferramentas).
   - Capacidade produtiva real calculada por:  
     $$\text{Horas Produtivas} = \text{Pessoas} \times \text{Horas/Dia} \times \text{Dias/Mês} \times \text{Produtividade \%}$$
   - Taxa horária da oficina calculada dinamicamente:  
     $$\text{Taxa Horária} = \frac{\text{Despesas Fixas} + \text{Depreciação Periféricos}}{\text{Horas Produtivas}}$$

5. **Histórico de Orçamentos & Persistência Dupla (MongoDB + LocalStorage):**
   - Quando conectado à VPS com MongoDB, sincroniza automaticamente no banco.
   - Caso o backend esteja offline ou desconectado, funciona 100% no modo local via `localStorage`.

---

## 🛠️ Stack Tecnológica

- **Frontend:** React 19, TypeScript, Vite 6, Tailwind CSS v4, Lucide React
- **Backend:** Node.js (v20+ / v22+), Express, Mongoose
- **Banco de Dados:** MongoDB (nativamente compatível com os snapshots históricos dos orçamentos)
- **Containerização & Deploy:** Docker Multi-stage, Docker Compose, GitHub Actions CI/CD (SSH deploy na VPS)

---

## 💻 Como Rodar Localmente

### 1. Clonar e Instalar Dependências
```bash
git clone <URL_DO_REPOSITORIO>
cd 3DCost
npm install
```

### 2. Modo Desenvolvimento (Vite com Hot-Reload)
```bash
npm run dev
```
Acesse `http://localhost:5173`.

### 3. Modo Fullstack (Servidor Express com API + Frontend Produção)
```bash
npm run build
npm run server
```
Acesse `http://localhost:3000`.

---

## 🌐 Deploy na VPS com Docker

O projeto já vem preparado para a arquitetura multi-site da VPS:

- **Porta alocada no Host:** `3070` (para não conflitar com `3050` do FakeDC e `3060` do RealClima).
- **Porta interna do Container:** `3000`.

### Subir Manualmente na VPS:
```bash
# Na VPS:
mkdir -p /root/3dcost
cd /root/3dcost
git clone <URL_DO_REPO> .
docker compose up -d --build
```

### Deploy Automático via GitHub Actions:
Adicione os Secrets em `Settings > Secrets and variables > Actions` no seu repositório GitHub:
- `VPS_HOST`: `187.127.17.88`
- `VPS_USER`: `root`
- `VPS_PASSWORD`: `<sua_senha_ssh>`
- `VPS_PORT`: `22`

A cada `git push origin main`, o container é compilado e atualizado automaticamente na VPS!

---

## 📌 Roadmap & Backlog (Próximas Versões)

### Versão 1.1 (Em Planejamento)
- [ ] **Cadastro Ultrarrápido de Clientes:** Enxugar o formulário de cadastro para conter estritamente:
  - **Nome** (Cliente ou Empresa)
  - **Número** (WhatsApp com DDD para disparo)
  - **Observações** (Preferências de material, cores, histórico)
  *(Remoção de campos secundários como CPF/CNPJ, e-mail e endereço para atendimento ágil e sem fricção).*
- [ ] **Templates de Mensagem WhatsApp Customizáveis:** Permitir personalizar a mensagem padrão direto na tela de configurações.
- [ ] **Disparo de Proposta com PDF Anexo:** Envio do PDF gerado via webhook/Evolution API na VPS.

