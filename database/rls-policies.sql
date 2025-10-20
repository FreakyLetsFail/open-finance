-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view their own profile"
    ON users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON users FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Allow user registration"
    ON users FOR INSERT
    WITH CHECK (true);

-- Accounts table policies
CREATE POLICY "Users can view their own accounts"
    ON accounts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own accounts"
    ON accounts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own accounts"
    ON accounts FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own accounts"
    ON accounts FOR DELETE
    USING (auth.uid() = user_id);

-- Transactions table policies
CREATE POLICY "Users can view transactions for their accounts"
    ON transactions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM accounts
            WHERE accounts.id = transactions.account_id
            AND accounts.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create transactions for their accounts"
    ON transactions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM accounts
            WHERE accounts.id = account_id
            AND accounts.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update transactions for their accounts"
    ON transactions FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM accounts
            WHERE accounts.id = transactions.account_id
            AND accounts.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete transactions for their accounts"
    ON transactions FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM accounts
            WHERE accounts.id = transactions.account_id
            AND accounts.user_id = auth.uid()
        )
    );

-- Budgets table policies
CREATE POLICY "Users can view their own budgets"
    ON budgets FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own budgets"
    ON budgets FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budgets"
    ON budgets FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budgets"
    ON budgets FOR DELETE
    USING (auth.uid() = user_id);

-- Goals table policies
CREATE POLICY "Users can view their own goals"
    ON goals FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own goals"
    ON goals FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals"
    ON goals FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals"
    ON goals FOR DELETE
    USING (auth.uid() = user_id);

-- Admin policies (optional)
CREATE POLICY "Admins can view all users"
    ON users FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );
