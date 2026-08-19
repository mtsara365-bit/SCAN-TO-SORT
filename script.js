const API_URL = "https://script.google.com/a/macros/shopee.com/s/AKfycbzDA4Qu75nOs6qG4BeTEmge8i7FaBeyokHUUX08M54Ic-F6F67fEviYWCuFFddgIw_hlw/exec";


let dados = [];

let graficoProdutividade;

let graficoVolume;


// ==============================
// CARREGAR DADOS
// ==============================

async function carregarDados() {

    try {

        const resposta = await fetch(API_URL);

        if (!resposta.ok) {

            throw new Error("Erro ao acessar API");

        }

        dados = await resposta.json();

        console.log("Dados recebidos:", dados);

        document.getElementById("statusAPI").innerText =
            "● API ONLINE";

        document.getElementById("statusAPI").style.background =
            "#dff5e1";

        preencherFiltros();

        atualizarDashboard(dados);

    } catch (erro) {

        console.error(erro);

        document.getElementById("statusAPI").innerText =
            "● ERRO NA API";

        document.getElementById("statusAPI").style.background =
            "#ffdede";

    }

}


// ==============================
// FILTROS
// ==============================

function preencherFiltros() {

    preencherSelect(
        "filtroData",
        dados.map(item => item.day_ref)
    );

    preencherSelect(
        "filtroTurno",
        dados.map(item => item.TURNO)
    );

    preencherSelect(
        "filtroEstacao",
        dados.map(item => item.station_code)
    );

    preencherSelect(
        "filtroOperador",
        dados.map(item => item.operator)
    );

}


function preencherSelect(id, valores) {

    const select = document.getElementById(id);

    const valoresUnicos = [...new Set(
        valores.filter(valor => valor !== undefined && valor !== null && valor !== "")
    )];

    valoresUnicos.forEach(valor => {

        const option = document.createElement("option");

        option.value = valor;

        option.textContent = valor;

        select.appendChild(option);

    });

}


// ==============================
// APLICAR FILTROS
// ==============================

function aplicarFiltros() {

    const data =
        document.getElementById("filtroData").value;

    const turno =
        document.getElementById("filtroTurno").value;

    const estacao =
        document.getElementById("filtroEstacao").value;

    const operador =
        document.getElementById("filtroOperador").value;


    const filtrados = dados.filter(item => {

        return (

            (!data || item.day_ref === data) &&

            (!turno || item.TURNO === turno) &&

            (!estacao || item.station_code === estacao) &&

            (!operador || item.operator === operador)

        );

    });


    atualizarDashboard(filtrados);

}


// ==============================
// DASHBOARD
// ==============================

function atualizarDashboard(registros) {

    const volume = registros.reduce(

        (total, item) =>

            total + Number(item.qty_orders || item.VOLUME || 0),

        0

    );


    const operadores = new Set(

        registros.map(item =>
            item.operator || item.OPERADOR
        )

    );


    const estacoes = new Set(

        registros.map(item =>
            item.station_code || item.ESTAÇÃO
        )

    );


    document.getElementById("volumeTotal").innerText =
        volume.toLocaleString("pt-BR");


    document.getElementById("totalOperadores").innerText =
        operadores.size;


    document.getElementById("totalEstacoes").innerText =
        estacoes.size;


    atualizarGraficos(registros);

    atualizarRanking(registros);

}


// ==============================
// GRÁFICOS
// ==============================

function atualizarGraficos(registros) {

    const horas = {};

    registros.forEach(item => {

        const hora = item.hour_start || "00:00";

        const volume =
            Number(item.qty_orders || item.VOLUME || 0);

        if (!horas[hora]) {

            horas[hora] = {
                volume: 0,
                quantidade: 0
            };

        }

        horas[hora].volume += volume;

        horas[hora].quantidade++;

    });


    const labels = Object.keys(horas).sort();


    const volumes = labels.map(
        hora => horas[hora].volume
    );


    const produtividade = labels.map(
        hora => {

            if (horas[hora].quantidade === 0) {

                return 0;

            }

            return (
                horas[hora].volume /
                horas[hora].quantidade
            ).toFixed(1);

        }
    );


    if (graficoProdutividade) {

        graficoProdutividade.destroy();

    }


    if (graficoVolume) {

        graficoVolume.destroy();

    }


    graficoProdutividade = new Chart(

        document.getElementById("graficoProdutividade"),

        {

            type: "line",

            data: {

                labels: labels,

                datasets: [{

                    label: "Produtividade",

                    data: produtividade,

                    tension: 0.3

                }]

            }

        }

    );


    graficoVolume = new Chart(

        document.getElementById("graficoVolume"),

        {

            type: "bar",

            data: {

                labels: labels,

                datasets: [{

                    label: "Volume",

                    data: volumes

                }]

            }

        }

    );

}


// ==============================
// RANKING
// ==============================

function atualizarRanking(registros) {

    const ranking = {};

    registros.forEach(item => {

        const operador =
            item.operator || item.OPERADOR || "Não informado";

        const volume =
            Number(item.qty_orders || item.VOLUME || 0);


        if (!ranking[operador]) {

            ranking[operador] = {

                volume: 0,

                quantidade: 0

            };

        }


        ranking[operador].volume += volume;

        ranking[operador].quantidade++;

    });


    const lista = Object.entries(ranking)

        .map(([operador, dados]) => ({

            operador,

            volume: dados.volume,

            produtividade:

                dados.volume /
                dados.quantidade

        }))

        .sort(

            (a, b) =>
                b.produtividade -
                a.produtividade

        );


    const tbody =
        document.getElementById("rankingOperadores");


    tbody.innerHTML = "";


    lista.slice(0, 20).forEach(item => {

        const linha =
            document.createElement("tr");


        linha.innerHTML = `

            <td>${item.operador}</td>

            <td>${item.volume.toLocaleString("pt-BR")}</td>

            <td>${item.produtividade.toFixed(1)}</td>

        `;


        tbody.appendChild(linha);

    });

}


// ==============================
// EVENTOS DOS FILTROS
// ==============================

document
    .getElementById("filtroData")
    .addEventListener("change", aplicarFiltros);


document
    .getElementById("filtroTurno")
    .addEventListener("change", aplicarFiltros);


document
    .getElementById("filtroEstacao")
    .addEventListener("change", aplicarFiltros);


document
    .getElementById("filtroOperador")
    .addEventListener("change", aplicarFiltros);


// ==============================
// INICIAR
// ==============================

carregarDados();
