/**
 * Healthcare Data Analysis & Prediction System
 * Apriori Association Rule Mining
 */

class Apriori {
    constructor(options = {}) {
        this.minSupport = options.minSupport || 0.15; // 15%
        this.minConfidence = options.minConfidence || 0.50; // 50%
        this.minLift = options.minLift || 1.0;
        this.maxItemsetSize = options.maxItemsetSize || 3;
        this.targetConsequent = options.targetConsequent || null; // filter rules
        this.frequentItemsets = [];
        this.rules = [];
    }

    /**
     * Discretize tabular healthcare data into categorical transactions
     */
    static discretizeDataset(data, columns, continuousBinConfig = {}) {
        const transactions = [];

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const transaction = [];

            columns.forEach(col => {
                const val = row[col];
                if (val === null || val === undefined || val === '') return;

                const numVal = parseFloat(val);
                if (!isNaN(numVal) && continuousBinConfig[col]) {
                    // Use custom or default medical binning
                    const bins = continuousBinConfig[col];
                    let assignedBin = `${col}=High`;
                    for (let b of bins) {
                        if (numVal <= b.max) {
                            assignedBin = `${col}:${b.label}`;
                            break;
                        }
                    }
                    transaction.push(assignedBin);
                } else if (!isNaN(numVal)) {
                    // Auto 3-quantile binning or binary check
                    if (numVal === 0 || numVal === 1) {
                        transaction.push(`${col}=${numVal === 1 ? 'Yes' : 'No'}`);
                    } else {
                        transaction.push(`${col}=${val}`);
                    }
                } else {
                    // Categorical
                    transaction.push(`${col}=${val}`);
                }
            });

            if (transaction.length > 0) {
                transactions.push(transaction);
            }
        }

        return transactions;
    }

    fit(transactions) {
        const n = transactions.length;
        if (n === 0) return this;

        // Pre-convert transactions to Sets for fast lookup
        const txSets = transactions.map(t => new Set(t));

        // 1. Find frequent 1-itemsets
        const itemCounts = {};
        transactions.forEach(tx => {
            const seen = new Set(tx);
            seen.forEach(item => {
                itemCounts[item] = (itemCounts[item] || 0) + 1;
            });
        });

        let L1 = [];
        for (const item in itemCounts) {
            const supp = itemCounts[item] / n;
            if (supp >= this.minSupport) {
                L1.push({
                    items: [item],
                    count: itemCounts[item],
                    support: supp
                });
            }
        }

        this.frequentItemsets = [...L1];
        let currentFrequent = L1.map(f => f.items);

        // Map to quickly look up support of any itemset
        const supportMap = new Map();
        L1.forEach(f => supportMap.set(f.items.join('|'), f.support));

        // 2. Iterate for k = 2, 3...
        for (let k = 2; k <= this.maxItemsetSize; k++) {
            if (currentFrequent.length === 0) break;

            // Generate candidates C_k
            const candidates = this._generateCandidates(currentFrequent, k);
            const freqK = [];

            for (const cand of candidates) {
                let count = 0;
                for (let i = 0; i < n; i++) {
                    let hasAll = true;
                    for (let item of cand) {
                        if (!txSets[i].has(item)) {
                            hasAll = false;
                            break;
                        }
                    }
                    if (hasAll) count++;
                }

                const supp = count / n;
                if (supp >= this.minSupport) {
                    freqK.push(cand);
                    this.frequentItemsets.push({
                        items: cand,
                        count,
                        support: supp
                    });
                    supportMap.set(cand.join('|'), supp);
                }
            }

            currentFrequent = freqK;
        }

        // 3. Generate Association Rules from frequent itemsets of length >= 2
        this.rules = [];
        const multiItemsets = this.frequentItemsets.filter(f => f.items.length >= 2);

        multiItemsets.forEach(freq => {
            const items = freq.items;
            const itemsetSupp = freq.support;

            // Subsets generation
            const subsets = this._getAllSubsets(items);

            subsets.forEach(antecedent => {
                if (antecedent.length === 0 || antecedent.length === items.length) return;

                const consequent = items.filter(x => !antecedent.includes(x));
                if (consequent.length === 0) return;

                // If target consequent filter is specified
                if (this.targetConsequent) {
                    const match = consequent.some(c => c.toLowerCase().includes(this.targetConsequent.toLowerCase()));
                    if (!match) return;
                }

                const antKey = [...antecedent].sort().join('|');
                const conKey = [...consequent].sort().join('|');

                const antSupp = supportMap.get(antKey) || this._calculateSupport(txSets, antecedent, n);
                const conSupp = supportMap.get(conKey) || this._calculateSupport(txSets, consequent, n);

                if (antSupp === 0 || conSupp === 0) return;

                const confidence = itemsetSupp / antSupp;

                if (confidence >= this.minConfidence) {
                    const lift = confidence / conSupp;

                    if (lift >= this.minLift) {
                        const conviction = (1 - confidence === 0) ? Infinity : (1 - conSupp) / (1 - confidence);

                        this.rules.push({
                            antecedent,
                            consequent,
                            support: itemsetSupp,
                            confidence,
                            lift,
                            conviction: conviction === Infinity ? 99.9 : conviction,
                            clinicalInsight: this._generateClinicalInsight(antecedent, consequent, confidence, lift)
                        });
                    }
                }
            });
        });

        // Sort rules by Lift descending
        this.rules.sort((a, b) => b.lift - a.lift);

        return this;
    }

    _generateCandidates(prevFrequent, k) {
        const candidates = [];
        const candSet = new Set();

        for (let i = 0; i < prevFrequent.length; i++) {
            for (let j = i + 1; j < prevFrequent.length; j++) {
                const itemset1 = prevFrequent[i];
                const itemset2 = prevFrequent[j];

                // Check if first k-2 items match
                let canJoin = true;
                for (let m = 0; m < k - 2; m++) {
                    if (itemset1[m] !== itemset2[m]) {
                        canJoin = false;
                        break;
                    }
                }

                if (canJoin) {
                    const merged = Array.from(new Set([...itemset1, ...itemset2])).sort();
                    if (merged.length === k) {
                        const key = merged.join('|');
                        if (!candSet.has(key)) {
                            candSet.add(key);
                            candidates.push(merged);
                        }
                    }
                }
            }
        }

        return candidates;
    }

    _getAllSubsets(array) {
        const result = [[]];
        for (const value of array) {
            const len = result.length;
            for (let i = 0; i < len; i++) {
                result.push([...result[i], value]);
            }
        }
        return result;
    }

    _calculateSupport(txSets, itemset, total) {
        let count = 0;
        for (let i = 0; i < total; i++) {
            let hasAll = true;
            for (let item of itemset) {
                if (!txSets[i].has(item)) {
                    hasAll = false;
                    break;
                }
            }
            if (hasAll) count++;
        }
        return count / total;
    }

    _generateClinicalInsight(antecedent, consequent, confidence, lift) {
        const antStr = antecedent.map(a => a.replace('=', ': ')).join(' AND ');
        const conStr = consequent.map(c => c.replace('=', ': ')).join(' AND ');
        const liftFormatted = lift.toFixed(2);
        const confPct = (confidence * 100).toFixed(1);

        return `Patients exhibiting [${antStr}] show a ${liftFormatted}× increased likelihood of [${conStr}] (Confidence: ${confPct}%).`;
    }
}

if (typeof window !== 'undefined') window.Apriori = Apriori;
