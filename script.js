const urlBase = "http://159.65.228.63"
let recursosLista = [];
let minhaMatricula = null
let idEdicao = null;

document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    console.log("ID recebido por GET:", params.get("id"));

    if (params.has("id")) {
        idEdicao = params.get("id");
        carregarTarefaParaEdicao(idEdicao);
    }
});

function adicionarRecurso() {
    const recursoInput = document.getElementById("recursos");
    const recurso = recursoInput.value.trim();

    if (recurso === "") {
        alert("Digite um recurso antes de adicionar.");
        return;
    }

    recursosLista.push(recurso);
    atualizarListaRecursos();
    recursoInput.value = "";
}

function atualizarListaRecursos() {
    const div = document.getElementById("recursosAdicionados");
    div.innerHTML = "";

    recursosLista.forEach((r, index) => {
        const item = document.createElement("p");
        item.innerText = `${index + 1}. ${r}`;
        div.appendChild(item);
    });
}

async function enviar() {
    const prioridade = document.getElementById("urgencia").value
    const conteudo = document.getElementById("conteudo").value
    const local = document.getElementById("local").value
    const data = document.getElementById("data").value
    const matricula = document.getElementById("matricula").value
    minhaMatricula = document.getElementById("matricula").value
    localStorage.setItem("minhaMatricula", minhaMatricula);

    if (prioridade === "" || conteudo === "" || local === "" || data === "" || matricula === "") {
        alert("Voce deixou algo em branco.");
        return;
    }

    const dataObj = new Date(data);
        const ano = dataObj.getFullYear();
        const mes = String(dataObj.getMonth() + 1).padStart(2, '0');
        const dia = String(dataObj.getDate()).padStart(2, '0');
        const horas = String(dataObj.getHours()).padStart(2, '0');
        const minutos = String(dataObj.getMinutes()).padStart(2, '0');
        const dataFormatada = `${dia}/${mes}/${ano} ${horas}:${minutos}`;

    const dados = {
        prioridade: prioridade,
        conteudo: conteudo,
        local: local,
        recursos: recursosLista,
        data: dataFormatada,
        matricula: matricula
    }

    const response = await fetch(urlBase + "/tarefas", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(dados)
    })

    abrirPopupSucesso();
    limparFormulario();

    const resultado = await response.json()
    console.log(resultado);
}

function normalizarTexto(texto) {
    return texto
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

async function carregarTarefas() {
    const response = await fetch(urlBase + "/tarefas");
    todasTarefas = await response.json();
    minhaMatricula = localStorage.getItem("minhaMatricula");


    const lista = document.getElementById("lista");
    lista.innerHTML = "";

    todasTarefas.forEach((tarefa, index) => {

        const urgencia = detectarUrgencia(tarefa);
        const dataBruta = tarefa.data || tarefa.data_limite || null;
        const matricula = tarefa.matricula || "—";

        let dataFormatada = "—";
        if (dataBruta) {
            const dataObj = new Date(dataBruta);
            const ano = dataObj.getFullYear();
            const mes = String(dataObj.getMonth() + 1).padStart(2, '0');
            const dia = String(dataObj.getDate()).padStart(2, '0');
            const horas = String(dataObj.getHours()).padStart(2, '0');
            const minutos = String(dataObj.getMinutes()).padStart(2, '0');
            dataFormatada = `${dia}/${mes}/${ano} ${horas}:${minutos}`;
        }


        const card = document.createElement("div");
        card.className = "card";
        card.onclick = () => abrirPopup(index);

        const urgNorm = normalizarTexto(urgencia);

        let classeUrgencia = "";
        if (urgNorm.includes("baix")) {
            classeUrgencia = "urgencia-baixa";
        } else if (urgNorm.includes("norm")) {
            classeUrgencia = "urgencia-normal";
        } else if (urgNorm.includes("urg")) {
            classeUrgencia = "urgencia-urgente";
        }

        card.innerHTML = `
            <p class="urgencia ${classeUrgencia}">${urgencia}</p>
            <strong>Data limite:</strong> ${dataFormatada}<br>
            <strong>Matrícula:</strong> ${matricula}
        `;

        lista.appendChild(card);
    });
}

function detectarUrgencia(tarefa) {
    const chaves = Object.keys(tarefa);

    function norm(txt) {
        return String(txt)
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim();
    }

    for (const chave of chaves) {
        const chaveNorm = norm(chave);

        if (chaveNorm.includes("prior") || chaveNorm.includes("urg")) {
            return tarefa[chave];
        }
    }

    for (const chave of chaves) {
        const valor = tarefa[chave];

        if (typeof valor === "string") {
            const valorNorm = norm(valor);
            if (["baixa", "normal", "urgente"].some(v => valorNorm.includes(v))) {
                return valor;
            }
        }
    }

    for (const chave of chaves) {
        if (typeof tarefa[chave] === "string") {
            return tarefa[chave];
        }
    }
    
    return "—";
}


function abrirPopup(index) {
    const popup = document.getElementById("popup");
    const info = document.getElementById("popupInfo");
    const tarefa = todasTarefas[index];

    info.innerHTML = "";

    Object.keys(tarefa).forEach(chave => {
        const linha = document.createElement("p");
        let valor = tarefa[chave];

        if (chave.toLowerCase().includes("recurso")) {

            const divRecursos = document.createElement("div");
            divRecursos.innerHTML = `<strong>${chave}:</strong><br>`;

            if (typeof valor === "string") {
                valor.split(/[,;]+/).forEach(r => {
                    const item = document.createElement("div");
                    item.textContent = "- " + r.trim();
                    divRecursos.appendChild(item);
                });

                info.appendChild(divRecursos);
                return;
            }

            if (Array.isArray(valor)) {
                valor.forEach(r => {
                    const item = document.createElement("div");

                    if (typeof r === "string") {
                        item.textContent = "- " + r;
                    } else if (typeof r === "object" && r !== null) {
                        const chaveObj = Object.keys(r)[0];
                        item.textContent = "- " + r[chaveObj];
                    }

                    divRecursos.appendChild(item);
                });

                info.appendChild(divRecursos);
                return;
            }
        }

        linha.innerHTML = `<strong>${chave}:</strong> ${valor}`;
        info.appendChild(linha);
    });
    //const minhasTarefas = todasTarefas.filter(t => t.matricula === matricula);

    const matriculaTarefa = Number(String(tarefa.matricula).trim());
    const matriculaUsuario = Number(String(minhaMatricula).trim());


    if (matriculaTarefa === matriculaUsuario) {
        const btnEditar = document.createElement("button");
        btnEditar.textContent = "Editar";
        btnEditar.onclick = () => {
            window.location.href = `editar.html?id=${tarefa.id}`;
            // usar metodo PUT (/tarefas/idTarefa)
            // fazer outro GET (/tarefas/idTarefa) que retorna os dados apenas daquela tarefa
        };
        info.appendChild(btnEditar);
    }

    popup.style.display = "flex";
}

document.getElementById("fecharTarefa").onclick = () => {
    document.getElementById("popup").style.display = "none";
};

carregarTarefas();

function abrirPopupSucesso() {
    document.getElementById("popupSucesso").style.display = "flex";
}

function fecharPopup() {
    document.getElementById("popupSucesso").style.display = "none";
}

function limparFormulario() {
    document.getElementById("urgencia").value = "";
    document.getElementById("conteudo").value = "";
    document.getElementById("local").value = "";
    document.getElementById("data").value = "";
    document.getElementById("matricula").value = "";

    recursosLista = [];
    atualizarListaRecursos();
}

async function carregarTarefaParaEdicao(id) {
    const response = await fetch(`${urlBase}/tarefas/${id}`);
    const tarefa = await response.json();

    console.log("DEBUG — Tarefa recebida:", tarefa);

    document.getElementById("urgencia").value = tarefa.prioridade || "";
    document.getElementById("conteudo").value = tarefa.conteudo || "";
    document.getElementById("local").value = tarefa.local || "";
    document.getElementById("data").value = tarefa.dataISO || "";
    document.getElementById("matricula").value = tarefa.matricula || "";

    if (tarefa.data) {

    // formato 25/02/2025 13:00
    if (tarefa.data.includes("/")) {
        const [dia, mes, resto] = tarefa.data.split("/");
        const [ano, horaMin] = resto.split(" ");
        const dataISO = `${ano}-${mes}-${dia}T${horaMin}`;
        document.getElementById("data").value = dataISO;
    }

    // formato 2025-02-25T13:00
    else if (tarefa.data.includes("T")) {
        document.getElementById("data").value = tarefa.data;
    }
}

    if (Array.isArray(tarefa.recursos)) {
        recursosLista = tarefa.recursos;
    } else if (typeof tarefa.recursos === "string") {
        recursosLista = tarefa.recursos.split(",").map(r => r.trim());
    } else {
        recursosLista = [];
    }
    atualizarListaRecursos();
}

async function salvarEdicao() {
    if (!idEdicao) {
        alert("Erro: nenhuma tarefa carregada para a edição.")
        return
    }

    const prioridade = document.getElementById("urgencia").value;
    const conteudo = document.getElementById("conteudo").value;
    const local = document.getElementById("local").value;
    const data = document.getElementById("data").value;
    const matricula = document.getElementById("matricula").value;

    if (!prioridade || !conteudo || !local || !data || !matricula) {
        alert("Por favor, preencha todos os campos obrigatórios.");
        return;
    }

    const dataObj = new Date(data);
    const ano = dataObj.getFullYear();
    const mes = String(dataObj.getMonth() + 1).padStart(2, '0');
    const dia = String(dataObj.getDate()).padStart(2, '0');
    const horas = String(dataObj.getHours()).padStart(2, '0');
    const minutos = String(dataObj.getMinutes()).padStart(2, '0');
    const dataFormatada = `${dia}/${mes}/${ano} ${horas}:${minutos}`;

    const dadosAtualizados = {
        id: idEdicao,
        prioridade: prioridade,
        conteudo: conteudo,
        local: local,
        recursos: recursosLista,
        data: dataFormatada,
        matricula: matricula
    };

    const response = await fetch(`${urlBase}/tarefas/${idEdicao}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(dadosAtualizados)
    });

    if (!response.ok) {
        alert("Erro ao atualizar a tarefa.");
        return
    }

    abrirPopupSucesso();

    console.log(await response.json());
}