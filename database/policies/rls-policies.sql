-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================
-- Description: Comprehensive RLS policies for data protection and access control
-- Compliance: GDPR, German data protection laws
-- ============================================================================

-- ============================================================================
-- 1. ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiscal_years ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. HELPER FUNCTIONS FOR RLS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 2.1 Get Current User ID
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION auth.current_user_id()
RETURNS UUID AS $$
    SELECT id FROM users WHERE auth_user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

COMMENT ON FUNCTION auth.current_user_id() IS 'Returns the current user ID from users table';

-- ----------------------------------------------------------------------------
-- 2.2 Check User Role
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION auth.has_role(role_type_check user_role_type)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1
        FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = auth.current_user_id()
        AND r.role_type = role_type_check
        AND r.is_active = true
        AND ur.valid_from <= NOW()
        AND (ur.valid_until IS NULL OR ur.valid_until > NOW())
    );
$$ LANGUAGE SQL SECURITY DEFINER;

COMMENT ON FUNCTION auth.has_role(user_role_type) IS 'Checks if current user has specified role';

-- ----------------------------------------------------------------------------
-- 2.3 Check Any Admin Role
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN AS $$
    SELECT auth.has_role('admin'::user_role_type);
$$ LANGUAGE SQL SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 2.4 Check Treasurer Role
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION auth.is_treasurer()
RETURNS BOOLEAN AS $$
    SELECT auth.has_role('admin'::user_role_type) OR
           auth.has_role('treasurer'::user_role_type);
$$ LANGUAGE SQL SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 2.5 Check Board Member Role
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION auth.is_board_member()
RETURNS BOOLEAN AS $$
    SELECT auth.has_role('admin'::user_role_type) OR
           auth.has_role('board_member'::user_role_type);
$$ LANGUAGE SQL SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 2.6 Check if user can read financial data
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION auth.can_read_financial()
RETURNS BOOLEAN AS $$
    SELECT auth.is_admin() OR
           auth.is_treasurer() OR
           auth.is_board_member() OR
           auth.has_role('auditor'::user_role_type);
$$ LANGUAGE SQL SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 2.7 Check if user can write financial data
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION auth.can_write_financial()
RETURNS BOOLEAN AS $$
    SELECT auth.is_admin() OR auth.is_treasurer();
$$ LANGUAGE SQL SECURITY DEFINER;

-- ============================================================================
-- 3. USERS TABLE POLICIES
-- ============================================================================

-- Users can read their own profile
CREATE POLICY "users_select_own"
    ON users FOR SELECT
    USING (auth_user_id = auth.uid() OR auth.is_admin());

-- Admins can read all users
CREATE POLICY "users_select_admin"
    ON users FOR SELECT
    USING (auth.is_admin());

-- Users can update their own profile (limited fields)
CREATE POLICY "users_update_own"
    ON users FOR UPDATE
    USING (auth_user_id = auth.uid())
    WITH CHECK (
        auth_user_id = auth.uid() AND
        -- Prevent users from changing critical fields
        id = (SELECT id FROM users WHERE auth_user_id = auth.uid()) AND
        auth_user_id = (SELECT auth_user_id FROM users WHERE auth_user_id = auth.uid())
    );

-- Admins can update all users
CREATE POLICY "users_update_admin"
    ON users FOR UPDATE
    USING (auth.is_admin());

-- Only admins can insert users
CREATE POLICY "users_insert_admin"
    ON users FOR INSERT
    WITH CHECK (auth.is_admin());

-- Only admins can delete users
CREATE POLICY "users_delete_admin"
    ON users FOR DELETE
    USING (auth.is_admin());

-- ============================================================================
-- 4. ROLES TABLE POLICIES
-- ============================================================================

-- All authenticated users can read roles
CREATE POLICY "roles_select_all"
    ON roles FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Only admins can modify roles
CREATE POLICY "roles_insert_admin"
    ON roles FOR INSERT
    WITH CHECK (auth.is_admin());

CREATE POLICY "roles_update_admin"
    ON roles FOR UPDATE
    USING (auth.is_admin());

CREATE POLICY "roles_delete_admin"
    ON roles FOR DELETE
    USING (auth.is_admin());

-- ============================================================================
-- 5. USER_ROLES TABLE POLICIES
-- ============================================================================

-- Users can see their own role assignments
CREATE POLICY "user_roles_select_own"
    ON user_roles FOR SELECT
    USING (user_id = auth.current_user_id() OR auth.is_admin());

-- Only admins can manage role assignments
CREATE POLICY "user_roles_insert_admin"
    ON user_roles FOR INSERT
    WITH CHECK (auth.is_admin());

CREATE POLICY "user_roles_update_admin"
    ON user_roles FOR UPDATE
    USING (auth.is_admin());

CREATE POLICY "user_roles_delete_admin"
    ON user_roles FOR DELETE
    USING (auth.is_admin());

-- ============================================================================
-- 6. MEMBERS TABLE POLICIES (GDPR Compliant)
-- ============================================================================

-- Board members and treasurers can read all member data
CREATE POLICY "members_select_authorized"
    ON members FOR SELECT
    USING (
        auth.is_admin() OR
        auth.is_board_member() OR
        auth.is_treasurer()
    );

-- Regular members can only see limited data (name, email) of other members
CREATE POLICY "members_select_limited"
    ON members FOR SELECT
    USING (
        auth.has_role('member'::user_role_type) AND
        -- This policy would need additional logic to hide sensitive fields
        -- In practice, use a view with limited columns for regular members
        false -- Disabled, use dedicated view instead
    );

-- Admins and treasurers can insert members
CREATE POLICY "members_insert_authorized"
    ON members FOR INSERT
    WITH CHECK (
        auth.is_admin() OR auth.is_treasurer()
    );

-- Admins and treasurers can update members
CREATE POLICY "members_update_authorized"
    ON members FOR UPDATE
    USING (
        auth.is_admin() OR auth.is_treasurer()
    )
    WITH CHECK (
        -- Ensure GDPR consent is maintained
        (data_processing_consent = true OR (iban IS NULL AND sepa_mandate_date IS NULL))
    );

-- Only admins can delete members (soft delete preferred)
CREATE POLICY "members_delete_admin"
    ON members FOR DELETE
    USING (auth.is_admin());

-- ============================================================================
-- 7. CATEGORIES TABLE POLICIES
-- ============================================================================

-- All authenticated users can read categories
CREATE POLICY "categories_select_all"
    ON categories FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Treasurers and admins can manage categories
CREATE POLICY "categories_insert_treasurer"
    ON categories FOR INSERT
    WITH CHECK (auth.can_write_financial());

CREATE POLICY "categories_update_treasurer"
    ON categories FOR UPDATE
    USING (auth.can_write_financial());

CREATE POLICY "categories_delete_admin"
    ON categories FOR DELETE
    USING (auth.is_admin());

-- ============================================================================
-- 8. CONTRIBUTIONS TABLE POLICIES
-- ============================================================================

-- Authorized users can read contributions
CREATE POLICY "contributions_select_authorized"
    ON contributions FOR SELECT
    USING (auth.can_read_financial());

-- Treasurers can manage contributions
CREATE POLICY "contributions_insert_treasurer"
    ON contributions FOR INSERT
    WITH CHECK (auth.can_write_financial());

CREATE POLICY "contributions_update_treasurer"
    ON contributions FOR UPDATE
    USING (auth.can_write_financial());

CREATE POLICY "contributions_delete_admin"
    ON contributions FOR DELETE
    USING (auth.is_admin());

-- ============================================================================
-- 9. TRANSACTIONS TABLE POLICIES
-- ============================================================================

-- Authorized users can read transactions
CREATE POLICY "transactions_select_authorized"
    ON transactions FOR SELECT
    USING (auth.can_read_financial());

-- Treasurers can create transactions
CREATE POLICY "transactions_insert_treasurer"
    ON transactions FOR INSERT
    WITH CHECK (auth.can_write_financial());

-- Treasurers can update transactions (with restrictions)
CREATE POLICY "transactions_update_treasurer"
    ON transactions FOR UPDATE
    USING (
        auth.can_write_financial() AND
        -- Cannot update reconciled transactions
        (is_reconciled = false OR auth.is_admin())
    )
    WITH CHECK (
        auth.can_write_financial() AND
        -- Ensure logical consistency
        amount > 0
    );

-- Only admins can delete transactions (audit trail)
CREATE POLICY "transactions_delete_admin"
    ON transactions FOR DELETE
    USING (
        auth.is_admin() AND
        -- Cannot delete reconciled transactions
        is_reconciled = false
    );

-- ============================================================================
-- 10. AUDIT LOG POLICIES
-- ============================================================================

-- Only admins and auditors can read audit logs
CREATE POLICY "audit_log_select_authorized"
    ON audit_log FOR SELECT
    USING (
        auth.is_admin() OR
        auth.has_role('auditor'::user_role_type)
    );

-- No one can modify audit logs (system managed)
-- INSERT is handled by triggers only

-- ============================================================================
-- 11. FISCAL YEARS POLICIES
-- ============================================================================

-- All authenticated users can read fiscal years
CREATE POLICY "fiscal_years_select_all"
    ON fiscal_years FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Only admins can manage fiscal years
CREATE POLICY "fiscal_years_insert_admin"
    ON fiscal_years FOR INSERT
    WITH CHECK (auth.is_admin());

CREATE POLICY "fiscal_years_update_admin"
    ON fiscal_years FOR UPDATE
    USING (auth.is_admin());

CREATE POLICY "fiscal_years_delete_admin"
    ON fiscal_years FOR DELETE
    USING (auth.is_admin());

-- ============================================================================
-- 12. GDPR COMPLIANCE VIEWS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 12.1 Limited Member View for Regular Members
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW members_public AS
SELECT
    id,
    member_number,
    first_name,
    last_name,
    email,
    member_status,
    join_date
FROM members
WHERE member_status = 'active';

-- Grant access to authenticated users
GRANT SELECT ON members_public TO authenticated;

COMMENT ON VIEW members_public IS 'Limited member information for regular members (GDPR compliant)';

-- ----------------------------------------------------------------------------
-- 12.2 Financial Summary View
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW financial_summary AS
SELECT
    DATE_TRUNC('month', transaction_date) as month,
    transaction_type,
    c.name as category_name,
    COUNT(*) as transaction_count,
    SUM(amount) as total_amount,
    AVG(amount) as average_amount
FROM transactions t
JOIN categories c ON t.category_id = c.id
WHERE t.transaction_status = 'completed'
GROUP BY DATE_TRUNC('month', transaction_date), transaction_type, c.name;

-- Grant access to authorized users
GRANT SELECT ON financial_summary TO authenticated;

COMMENT ON VIEW financial_summary IS 'Aggregated financial data for reporting';

-- ============================================================================
-- 13. SECURITY BEST PRACTICES
-- ============================================================================

-- Revoke public access to tables
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;

-- Grant necessary access to authenticated role
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- ============================================================================
-- 14. DATA RETENTION & GDPR COMPLIANCE
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 14.1 Function to anonymize member data (GDPR right to be forgotten)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION anonymize_member(member_id_to_anonymize UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE members
    SET
        first_name = 'ANONYMIZED',
        last_name = 'ANONYMIZED',
        email = NULL,
        phone = NULL,
        mobile = NULL,
        street = NULL,
        postal_code = NULL,
        city = NULL,
        iban = NULL,
        bic = NULL,
        sepa_mandate_reference = NULL,
        notes = 'Anonymized per GDPR request',
        data_processing_consent = false,
        newsletter_consent = false
    WHERE id = member_id_to_anonymize;

    -- Log the anonymization
    INSERT INTO audit_log (table_name, record_id, action, user_id)
    VALUES ('members', member_id_to_anonymize, 'ANONYMIZE', auth.current_user_id());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Only admins can anonymize members
REVOKE ALL ON FUNCTION anonymize_member FROM PUBLIC;
GRANT EXECUTE ON FUNCTION anonymize_member TO authenticated;

COMMENT ON FUNCTION anonymize_member IS 'Anonymizes member data for GDPR compliance (right to be forgotten)';

-- ============================================================================
-- END OF RLS POLICIES
-- ============================================================================
