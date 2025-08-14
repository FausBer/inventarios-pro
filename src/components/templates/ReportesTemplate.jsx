import styled from "styled-components";

export function ReportesTemplate() {
  <Container>
    <Sidebar>
      <SidebarSection></SidebarSection>
    </Sidebar>
  </Container>;
}
const Container = styled.div`
  min-height: 100vh;
  padding: 15px;
  width: 100%;
  color: ${({ theme }) => theme.text};
`;

const Sidebar = styled.div`
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  @media (max-width: 768px) {
    width: 250px;
    order: 2;
  }
`;

const SidebarSection = styled.div`
  margin-bottom: 20px;
  border-radius: 10px;
  border: 2px solid ${({ theme }) => theme.color2};
  padding: 12px;
`;
