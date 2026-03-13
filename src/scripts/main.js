document.addEventListener('DOMContentLoaded', function () {
    const botaoCalcular = document.getElementById('calcular');

    botaoCalcular.addEventListener('click', function () {
        const valorImovel = converterValorMonetario(document.getElementById('valor-imovel').value);
        const entrada = converterValorMonetario(document.getElementById('entrada').value);
        const prazoAnos = Number(document.getElementById('prazo').value);
        const jurosAnual = Number(document.getElementById('juros-anual').value);
        const rendaMensal = converterValorMonetario(document.getElementById('renda-mensal').value);
        const sistema = document.getElementById('sistema').value;

        const mensagemErro = document.getElementById('mensagem-erro');

        mensagemErro.textContent = '';

        const validacao = validarCampos(
            valorImovel,
            entrada,
            prazoAnos,
            jurosAnual,
            rendaMensal
        );

        if (!validacao.valido) {
            limparResultados();
            mensagemErro.textContent = validacao.mensagem;
            return;
        }

        const valorFinanciado = valorImovel - entrada;
        const parcelas = prazoAnos * 12;
        const taxaMensal = jurosAnual / 12 / 100;

        let resultado;

        if (sistema === 'price') {
            resultado = calcularPrice(valorFinanciado, taxaMensal, parcelas);
        } else {
            resultado = calcularSac(valorFinanciado, taxaMensal, parcelas);
        }

        const rendaMinima = resultado.parcelaInicial / 0.3;

        atualizarResultados({
            valorFinanciado,
            parcelaInicial: resultado.parcelaInicial,
            totalPago: resultado.totalPago,
            jurosTotal: resultado.jurosTotal,
            rendaMinima,
            rendaMensal
        });

        renderizarTabela(resultado.tabela);
    });

    function validarCampos(valorImovel, entrada, prazoAnos, jurosAnual, rendaMensal) {
        if (!valorImovel || !entrada || !prazoAnos || !jurosAnual || !rendaMensal) {
            return {
                valido: false,
                mensagem: 'Preencha todos os campos para realizar a simulação.'
            };
        }

        if (valorImovel <= 0) {
            return {
                valido: false,
                mensagem: 'O valor do imóvel deve ser maior que zero.'
            };
        }

        if (entrada < 0) {
            return {
                valido: false,
                mensagem: 'A entrada não pode ser negativa.'
            };
        }

        if (entrada >= valorImovel) {
            return {
                valido: false,
                mensagem: 'A entrada deve ser menor que o valor do imóvel.'
            };
        }

        if (prazoAnos <= 0) {
            return {
                valido: false,
                mensagem: 'O prazo deve ser maior que zero.'
            };
        }

        if (jurosAnual <= 0) {
            return {
                valido: false,
                mensagem: 'A taxa de juros anual deve ser maior que zero.'
            };
        }

        if (rendaMensal <= 0) {
            return {
                valido: false,
                mensagem: 'A renda mensal deve ser maior que zero.'
            };
        }

        return {
            valido: true,
            mensagem: ''
        };
    }

    function calcularPrice(valorFinanciado, taxaMensal, parcelas) {
        const fator = Math.pow(1 + taxaMensal, parcelas);
        const parcela = valorFinanciado * ((taxaMensal * fator) / (fator - 1));

        let saldoDevedor = valorFinanciado;
        let totalPago = 0;
        let totalJuros = 0;
        const tabela = [];

        for (let i = 1; i <= parcelas; i++) {
            const juros = saldoDevedor * taxaMensal;
            const amortizacao = parcela - juros;
            saldoDevedor -= amortizacao;

            if (saldoDevedor < 0) {
                saldoDevedor = 0;
            }

            totalPago += parcela;
            totalJuros += juros;

            if (i <= 12) {
                tabela.push({
                    numero: i,
                    prestacao: parcela,
                    amortizacao,
                    juros,
                    saldoDevedor
                });
            }
        }

        return {
            parcelaInicial: parcela,
            totalPago,
            jurosTotal: totalJuros,
            tabela
        };
    }

    function calcularSac(valorFinanciado, taxaMensal, parcelas) {
        const amortizacaoConstante = valorFinanciado / parcelas;

        let saldoDevedor = valorFinanciado;
        let totalPago = 0;
        let totalJuros = 0;
        let parcelaInicial = 0;
        const tabela = [];

        for (let i = 1; i <= parcelas; i++) {
            const juros = saldoDevedor * taxaMensal;
            const prestacao = amortizacaoConstante + juros;
            saldoDevedor -= amortizacaoConstante;

            if (saldoDevedor < 0) {
                saldoDevedor = 0;
            }

            totalPago += prestacao;
            totalJuros += juros;

            if (i === 1) {
                parcelaInicial = prestacao;
            }

            if (i <= 12) {
                tabela.push({
                    numero: i,
                    prestacao,
                    amortizacao: amortizacaoConstante,
                    juros,
                    saldoDevedor
                });
            }
        }

        return {
            parcelaInicial,
            totalPago,
            jurosTotal: totalJuros,
            tabela
        };
    }

    function atualizarResultados(resultado) {
        document.getElementById('valor-financiado').textContent = formatarMoeda(resultado.valorFinanciado);
        document.getElementById('parcela-inicial').textContent = formatarMoeda(resultado.parcelaInicial);
        document.getElementById('total-pago').textContent = formatarMoeda(resultado.totalPago);
        document.getElementById('juros-total').textContent = formatarMoeda(resultado.jurosTotal);
        document.getElementById('renda-minima').textContent = formatarMoeda(resultado.rendaMinima);

        const situacaoRenda = document.getElementById('situacao-renda');
        situacaoRenda.classList.remove('positivo', 'negativo');

        if (resultado.parcelaInicial <= resultado.rendaMensal * 0.3) {
            situacaoRenda.textContent = 'Dentro da renda recomendada';
            situacaoRenda.classList.add('positivo');
        } else {
            situacaoRenda.textContent = 'Acima da renda recomendada';
            situacaoRenda.classList.add('negativo');
        }
    }

    function renderizarTabela(parcelas) {
        const tabelaParcelas = document.getElementById('tabela-parcelas');

        tabelaParcelas.innerHTML = '';

        parcelas.forEach(function (item) {
            const linha = document.createElement('tr');

            linha.innerHTML = `
                <td>${item.numero}</td>
                <td>${formatarMoeda(item.prestacao)}</td>
                <td>${formatarMoeda(item.amortizacao)}</td>
                <td>${formatarMoeda(item.juros)}</td>
                <td>${formatarMoeda(item.saldoDevedor)}</td>
            `;

            tabelaParcelas.appendChild(linha);
        });
    }

    function limparResultados() {
        document.getElementById('valor-financiado').textContent = 'R$ 0,00';
        document.getElementById('parcela-inicial').textContent = 'R$ 0,00';
        document.getElementById('total-pago').textContent = 'R$ 0,00';
        document.getElementById('juros-total').textContent = 'R$ 0,00';
        document.getElementById('renda-minima').textContent = 'R$ 0,00';
        document.getElementById('situacao-renda').textContent = '---';
        document.getElementById('situacao-renda').classList.remove('positivo', 'negativo');

        document.getElementById('tabela-parcelas').innerHTML = `
            <tr>
                <td colspan="5">Nenhuma simulação realizada.</td>
            </tr>
        `;
    }

    function formatarMoeda(valor) {
        return valor.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
    }

    function converterValorMonetario(valor) {
    return Number(valor.replace(/\./g, '').replace(',', '.'));
}

function formatarCampoMoeda(input) {
    let valor = input.value.replace(/\D/g, '');

    if (!valor) {
        input.value = '';
        return;
    }

    input.value = Number(valor).toLocaleString('pt-BR');
}
const camposMoeda = [
    document.getElementById('valor-imovel'),
    document.getElementById('entrada'),
    document.getElementById('renda-mensal')
];

camposMoeda.forEach(function (campo) {
    campo.addEventListener('input', function () {
        formatarCampoMoeda(campo);
    });
});
});