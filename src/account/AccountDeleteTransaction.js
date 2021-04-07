import AccountId from "./AccountId.js";
import Transaction, {
    TRANSACTION_REGISTRY,
} from "../transaction/Transaction.js";

/**
 * @namespace proto
 * @typedef {import("@hashgraph/proto").ITransaction} proto.ITransaction
 * @typedef {import("@hashgraph/proto").ISignedTransaction} proto.ISignedTransaction
 * @typedef {import("@hashgraph/proto").TransactionBody} proto.TransactionBody
 * @typedef {import("@hashgraph/proto").ITransactionBody} proto.ITransactionBody
 * @typedef {import("@hashgraph/proto").ITransactionResponse} proto.ITransactionResponse
 * @typedef {import("@hashgraph/proto").ICryptoDeleteTransactionBody} proto.ICryptoDeleteTransactionBody
 * @typedef {import("@hashgraph/proto").IAccountID} proto.IAccountID
 * @typedef {import("@hashgraph/proto").ISchedulableTransactionBody} proto.ISchedulableTransactionBody
 */

/**
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../transaction/TransactionId.js").default} TransactionId
 */

/**
 * Marks an account as deleted, moving all its current hbars to another account.
 *
 * It will remain in the ledger, marked as deleted, until it expires.
 * Transfers into it a deleted account fail. But a deleted account can still have its
 * expiration extended in the normal way.
 */
export default class AccountDeleteTransaction extends Transaction {
    /**
     * @param {object} props
     * @param {AccountId} [props.accountId]
     * @param {AccountId} [props.transferAccountId]
     */
    constructor(props = {}) {
        super();

        /**
         * @private
         * @type {?AccountId}
         */
        this._accountId = null;

        /**
         * @private
         * @type {?AccountId}
         */
        this._transferAccountId = null;

        if (props.accountId != null) {
            this.setAccountId(props.accountId);
        }

        if (props.transferAccountId != null) {
            this.setTransferAccountId(props.transferAccountId);
        }
    }

    /**
     * @internal
     * @param {proto.ITransaction[]} transactions
     * @param {proto.ISignedTransaction[]} signedTransactions
     * @param {TransactionId[]} transactionIds
     * @param {AccountId[]} nodeIds
     * @param {proto.ITransactionBody[]} bodies
     * @returns {AccountDeleteTransaction}
     */
    static _fromProtobuf(
        transactions,
        signedTransactions,
        transactionIds,
        nodeIds,
        bodies
    ) {
        const body = bodies[0];
        const accountDelete = /** @type {proto.ICryptoDeleteTransactionBody} */ (body.cryptoDelete);

        return Transaction._fromProtobufTransactions(
            new AccountDeleteTransaction({
                accountId:
                    accountDelete.deleteAccountID != null
                        ? AccountId._fromProtobuf(
                              /** @type {proto.IAccountID} */ (accountDelete.deleteAccountID)
                          )
                        : undefined,
                transferAccountId:
                    accountDelete.transferAccountID != null
                        ? AccountId._fromProtobuf(
                              /** @type {proto.IAccountID} */ (accountDelete.transferAccountID)
                          )
                        : undefined,
            }),
            transactions,
            signedTransactions,
            transactionIds,
            nodeIds,
            bodies
        );
    }

    /**
     * @returns {?AccountId}
     */
    get accountId() {
        return this._accountId;
    }

    /**
     * Set the account ID which is being deleted in this transaction.
     *
     * @param {AccountId | string} accountId
     * @returns {AccountDeleteTransaction}
     */
    setAccountId(accountId) {
        this._requireNotFrozen();
        this._accountId =
            accountId instanceof AccountId
                ? accountId
                : AccountId.fromString(accountId);

        return this;
    }

    /**
     * @returns {?AccountId}
     */
    get transferAccountId() {
        return this._transferAccountId;
    }

    /**
     * Set the account ID which will receive all remaining hbars.
     *
     * @param {AccountId | string} transferAccountId
     * @returns {AccountDeleteTransaction}
     */
    setTransferAccountId(transferAccountId) {
        this._requireNotFrozen();
        this._transferAccountId =
            transferAccountId instanceof AccountId
                ? transferAccountId
                : AccountId.fromString(transferAccountId);

        return this;
    }

    /**
     * @override
     * @internal
     * @param {Channel} channel
     * @param {proto.ITransaction} request
     * @returns {Promise<proto.ITransactionResponse>}
     */
    _execute(channel, request) {
        return channel.crypto.cryptoDelete(request);
    }

    /**
     * @override
     * @protected
     * @returns {NonNullable<proto.TransactionBody["data"]>}
     */
    _getTransactionDataCase() {
        return "cryptoDelete";
    }

    /**
     * @override
     * @protected
     * @returns {proto.ICryptoDeleteTransactionBody}
     */
    _makeTransactionData() {
        return {
            deleteAccountID:
                this._accountId != null ? this._accountId._toProtobuf() : null,
            transferAccountID:
                this._transferAccountId != null
                    ? this._transferAccountId._toProtobuf()
                    : null,
        };
    }

    /**
     * @override
     * @returns {proto.ISchedulableTransactionBody}
     */
    _getScheduledTransactionBody() {
        return {
            memo: super.transactionMemo,
            transactionFee: super.maxTransactionFee?.toTinybars(),
            cryptoDelete: /** @type {proto.ICryptoDeleteTransactionBody} */ {
                deleteAccountID:
                    this._accountId != null
                        ? this._accountId._toProtobuf()
                        : null,
                transferAccountID:
                    this._transferAccountId != null
                        ? this._transferAccountId._toProtobuf()
                        : null,
            },
        };
    }
}

TRANSACTION_REGISTRY.set(
    "cryptoDelete",
    // eslint-disable-next-line @typescript-eslint/unbound-method
    AccountDeleteTransaction._fromProtobuf
);
