const urlBase = "http://159.65.228.63";
let recursosLista = [];

window.onload = () => {
    fecharPopup();
};

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

function limparFormulario() {
    document.getElementById("urgencia").value = "";
    document.getElementById("conteudo").value = "";
    document.getElementById("local").value = "";
    document.getElementById("data").value = "";
    document.getElementById("matricula").value = "";

    recursosLista = [];
    atualizarListaRecursos();
}

function abrirPopupSucesso() {
    document.getElementById("popupSucesso").style.display = "flex";
}

function fecharPopup() {
    document.getElementById("popupSucesso").style.display = "none";
}