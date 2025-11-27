const urlBase = "http://159.65.228.63"
let recursosLista = [];

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

    if (prioridade === "" || conteudo === "" || local === "" || data === "" || matricula === "") {
        alert("Voce deixou algo em branco.");
        return;
    }

    const dados = {
        prioridade: prioridade,
        conteudo: conteudo,
        local: local,
        recursos: recursosLista.map(r => ({ nome: r })),
        data: data,
        matricula: matricula
    }

    const response = await fetch(urlBase + "/tarefas", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(dados)
    })

    const resultado = await response.json()
    console.log(resultado)
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

    const lista = document.getElementById("lista");
    lista.innerHTML = "";

    todasTarefas.forEach((tarefa, index) => {

        const urgencia = detectarUrgencia(tarefa);
        const data = tarefa.data || tarefa.data_limite || "—";
        const matricula = tarefa.matricula || "—";

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
            <strong>Data limite:</strong> ${data}<br>
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

    popup.style.display = "flex";
}

document.getElementById("fechar").onclick = () => {
    document.getElementById("popup").style.display = "none";
};

carregarTarefas();