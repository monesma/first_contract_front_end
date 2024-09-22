import { Address, Cell, Contract, ContractProvider, SendMode, Sender, beginCell, contractAddress } from "ton-core";
/* Importation des types et fonctions nécessaires depuis la librairie "ton-core".
 - `Address`: représente une adresse dans TON.
 - `Cell`: représente une cellule dans TON, utilisée pour stocker des données.
 - `Contract`: interface de base pour un contrat dans TON.
 - `beginCell`: permet de construire des cellules.
 - `contractAddress`: permet de calculer l'adresse d'un contrat basé sur son workchain et son état initial.*/

export type MainContractConfig = {
    number: number;
    address: Address;
    owner_address: Address;
}

export function mainContractConfigToCell(config: MainContractConfig): Cell {
    return beginCell()
    .storeUint(config.number, 32)
    .storeAddress(config.address)
    .storeAddress(config.owner_address)
    .endCell()
}

export class MainContract implements Contract {
    // Déclaration de la classe `MainContract` qui implémente l'interface `Contract`.

    constructor(
        readonly address: Address,
        readonly init?: { code: Cell; data: Cell }
        /* Le constructeur prend deux paramètres :
         - `address`: l'adresse du contrat.
         - `init`: un objet optionnel qui contient le `code` (code du contrat) et les `data` (données initiales).*/
    ) {}

    static createFromConfig(config: MainContractConfig, code: Cell, workchain = 0) {
        /* Méthode statique `createFromConfig` qui permet de créer une instance de `MainContract`.
         - `config`: configuration du contrat (non utilisé directement ici).
         - `code`: cellule contenant le code du contrat.
         - `workchain`: identifiant du workchain dans lequel le contrat sera déployé (par défaut 0).*/

        const data = mainContractConfigToCell(config);
        // Création d'une cellule avec la config initiale.
        
        const init = { code, data };
        // Création de l'état initial du contrat en combinant le `code` et la `data` (vide ici).

        const address = contractAddress(workchain, init);
        // Calcul de l'adresse du contrat en fonction du workchain et de l'état initial.

        return new MainContract(address, init);
        // Retourne une nouvelle instance de `MainContract` avec l'adresse calculée et l'état initial.
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(2, 32).endCell()
        });
    }

    async sendIncrement(
        provider: ContractProvider,
        sender: Sender,
        value: bigint,
        increment_by: number
    ) {
        /* Fonction asynchrone `sendInternalMessage` permettant d'envoyer un message interne à un contrat.
         - `provider`: instance de `ContractProvider`, utilisée pour interagir avec le contrat (envoyer des messages, appeler des méthodes).
         - `sender`: instance de `Sender`, représentant l'expéditeur du message (typiquement une clé ou un compte).
         - `value`: montant envoyé avec le message, exprimé en `bigint` (nanotons, c'est-à-dire des fractions de Toncoin).*/
        
        const msg_body = beginCell().storeUint(1, 32).storeUint(increment_by, 32).endCell();

        await provider.internal(sender, {
            value, 
            sendMode: SendMode.PAY_GAS_SEPARATELY, 
            body: msg_body,
        })
        // Utilisation du `provider` pour envoyer un message interne à partir du `sender`.
            //value:  Montant envoyé avec le message (en nanotons).
            /* Mode d'envoi du message :
             `SendMode.PAY_GAS_SEPARATELY` indique que l'expéditeur paie pour le gaz séparément,
            // ce qui signifie que la transaction peut consommer du gaz sans affecter le montant envoyé.*/
            /*Corps du message. Ici, on envoie une cellule vide, mais on pourrait y stocker des données
             ou des instructions spécifiques à destination du contrat. `beginCell()` démarre la création
             d'une cellule et `endCell()` la termine.*/
    }

    async sendDeposit(provider: ContractProvider, sender: Sender, value: bigint) {
        const msg_body = beginCell()
            .storeUint(2, 32) //OP mode
            .endCell();
        
        await provider.internal(sender, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: msg_body
        });
    }

    async sendNoCodeDeposit(
        provider: ContractProvider,
        sender: Sender,
        value: bigint
    ) {
        const msg_body = beginCell().endCell();

        await provider.internal(sender, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: msg_body
        });
    }

    async sendWithdrawalRequest(
        provider: ContractProvider,
        sender: Sender,
        value: bigint,
        amount: bigint
    ) {
        const msg_body = beginCell()
            .storeUint(3, 32) // OP code
            .storeCoins(amount)
            .endCell();
        
        await provider.internal(sender, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: msg_body
        });
    }
    
    async getData(provider: ContractProvider) {
        /* Fonction asynchrone `getData` qui interroge le contrat pour récupérer certaines données.
         - `provider`: instance de `ContractProvider`, utilisée pour interagir avec le contrat.*/
    
        const { stack } = await provider.get("get_contract_storage_data", []);
        /* Appel de la méthode "get_the_latest_sender" du contrat via le `provider`.
        La méthode ne prend aucun argument (c'est pourquoi on passe un tableau vide `[]`).
        Le résultat renvoyé par le contrat est décomposé pour obtenir la pile de retour (`stack`),
        qui contient les données renvoyées par le contrat.*/
    
        return {
            number: stack.readNumber(),
            recent_sender: stack.readAddress(),
            owner_address: stack.readAddress()
        };
        // On lit l'adresse du dernier expéditeur depuis la pile en utilisant `stack.readAddress()`.
            // Cette adresse est retournée dans un objet avec la clé `recent_sender`.
    }
    
    async getBalance(provider: ContractProvider) {
        const { stack } = await provider.get("balance", []);
        return {
            balance: stack.readNumber()
        }
    }
}
