const urlBase = "http://159.65.228.63";
let recursosLista = [];
let idEdicao = null;

window.onload = () => {
    fecharPopup();
};

document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("id")) {
        idEdicao = params.get("id");
        carregarTarefaParaEdicao(idEdicao);
    }
});

async function carregarTarefaParaEdicao(id) {
    console.log("DEBUG — Carregando tarefa com ID:", id);
    const response = await fetch(`${urlBase}/tarefas/${id}`);
    const tarefa = await response.json();

    console.log("DEBUG — Tarefa recebida:", tarefa);

    document.getElementById("urgencia").value = tarefa.prioridade || "";
    document.getElementById("conteudo").value = tarefa.conteudo || "";
    document.getElementById("local").value = tarefa.local || "";
    document.getElementById("data").value = tarefa.dataISO || "";
    document.getElementById("matricula").value = tarefa.matricula || "";

    recursosLista = Array.isArray(tarefa.recursos) ? tarefa.recursos : [];
    atualizarListaRecursos();

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
}

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

function fecharPopup() {
    document.getElementById("popupSucesso").style.display = "none";
}