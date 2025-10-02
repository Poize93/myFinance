# Investment Table Setup

## Create Investment Table in Supabase

Run this SQL in your Supabase SQL Editor:

```sql
CREATE TABLE investments (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL,
  investment_mode TEXT NOT NULL,
  investment_type TEXT NOT NULL,
  current_value DECIMAL(10,2) NOT NULL,
  investment_amount DECIMAL(10,2) NOT NULL,
  return_value DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations
CREATE POLICY "Allow all operations" ON investments FOR ALL USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_investments_updated_at BEFORE UPDATE ON investments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Investment Fields:
- **date**: Date of the investment record
- **investment_mode**: Mode of investment (e.g., SIP, Lump Sum, etc.)
- **investment_type**: Type of investment (e.g., Mutual Fund, Stocks, Bonds, etc.)
- **current_value**: Current market value of the investment
- **investment_amount**: Original amount invested
- **return_value**: Calculated return (current_value - investment_amount)

